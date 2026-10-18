import "server-only";

import { and, desc, eq, type SQL, sql } from "drizzle-orm";

import type {
  ContactDatabaseReader,
  ContactDatabaseTransaction,
} from "@invessiv/db/core";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import type { ExtraFeedbackRoundBlocker } from "@invessiv/common/constants/crm/extra-feedback-round-blockers";
import {
  findExtraFeedbackRoundBlocker,
  nextExtraFeedbackRoundPosition,
} from "@invessiv/common/patterns/crm/extra-feedback-round";
import { sortFeedbackRoundPositions } from "@invessiv/common/patterns/crm/feedback-round-positions";
import type { FeedbackHandOverBlocker } from "@invessiv/common/constants/crm/feedback-hand-over-blockers";
import { findFeedbackHandOverBlocker } from "@invessiv/common/patterns/crm/feedback-hand-over-blocker";
import {
  feedbackRoundItems,
  feedbackRounds,
  projects,
} from "@invessiv/db/record-configuration";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import {
  FEEDBACK_QUOTA_ACTIVITY_ENTITY,
  FEEDBACK_QUOTA_ACTIVITY_FIELD,
} from "@/common/constants/crm/feedback-round-activity-metadata";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { activityService } from "@/server/shared/services/activity-service";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import { feedbackResultHistoryService } from "@/server/shared/services/feedback/feedback-result-history-service";
import { feedbackRoundItemService } from "@/server/shared/services/feedback/feedback-round-item-service";
import type { FeedbackRoundRow } from "@/server/shared/services/feedback/feedback-service-types";
import { loadPortalContactNames } from "@/server/shared/services/load-portal-contact-names";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { feedbackInboxService } from "./feedback-inbox-service";
import { feedbackRoundMappingService } from "./feedback-round-mapping-service";
import type {
  CountedFeedbackRound,
  FeedbackProjectTrack,
} from "./feedback-round-types";

const trackColumns = {
  id: projects.id,
  customerId: projects.customer_id,
  title: projects.title,
  status: projects.status,
  version: projects.version,
  processSteps: projects.process_steps,
  currentProcessStep: projects.current_process_step,
  feedbackRoundPositions: projects.feedback_round_positions,
  includedFeedbackRounds: projects.included_feedback_rounds,
  feedbackAreas: projects.feedback_areas,
};

/**
 * The project's track, filtered by the caller's access condition. The handover passes `lock`: the
 * same row lock the project editor takes, so the track cannot move while a round is created.
 */
async function findProjectTrack(
  executor: ContactDatabaseReader,
  projectId: string,
  access: SQL | undefined,
  options: { lock: boolean } = { lock: false },
): Promise<FeedbackProjectTrack | null> {
  const query = executor
    .select(trackColumns)
    .from(projects)
    .where(and(eq(projects.id, projectId), access))
    .limit(1);
  const [project] = options.lock ? await query.for("update") : await query;
  return project ?? null;
}

/** All rounds of a project, newest first, with their item count for the list. */
async function listRounds(
  executor: ContactDatabaseReader,
  projectId: string,
): Promise<CountedFeedbackRound[]> {
  return executor
    .select({
      round: feedbackRounds,
      itemCount:
        sql<number>`(select count(*) from ${feedbackRoundItems} where ${feedbackRoundItems.round_id} = ${feedbackRounds.id})`.mapWith(
          Number,
        ),
      unread: sql<boolean>`(${feedbackInboxService.unreadCondition()})`,
    })
    .from(feedbackRounds)
    .where(eq(feedbackRounds.project_id, projectId))
    .orderBy(desc(feedbackRounds.round_number));
}

function findHandOverBlocker(
  project: FeedbackProjectTrack,
  rounds: readonly CountedFeedbackRound[],
): FeedbackHandOverBlocker | null {
  return findFeedbackHandOverBlocker({
    projectStatus: project.status,
    processSteps: project.processSteps,
    currentProcessStep: project.currentProcessStep,
    feedbackRoundPositions: project.feedbackRoundPositions,
    includedFeedbackRounds: project.includedFeedbackRounds,
    rounds: rounds.map(({ round }) => ({
      roundNumber: round.round_number,
      status: round.status,
    })),
  });
}

/**
 * One round with items, attachments and results. Attachments follow the member's own file scope,
 * so `projects.read` without `files.read` shows the items but no files.
 */
async function toRoundDto(
  executor: ContactDatabaseReader,
  round: FeedbackRoundRow,
  actor: WorkspaceActor,
): Promise<FeedbackRoundDto> {
  const [items, contactNames] = await Promise.all([
    feedbackRoundItemService.loadByRound(
      executor,
      [round.id],
      fileAccessService.readableCondition(actor),
    ),
    loadPortalContactNames(executor, [
      round.draft_updated_by_portal_membership_id,
      round.submitted_by_portal_membership_id,
    ]),
  ]);
  const history = await feedbackResultHistoryService.loadByItems(
    executor,
    (items.get(round.id) ?? []).map(({ item }) => item.id),
  );
  return feedbackRoundMappingService.toDto(
    round,
    items.get(round.id) ?? [],
    contactNames,
    history,
  );
}

/**
 * Adds one round step to the project's track and returns the reason when it cannot. The project
 * row is locked like for a handover and the project editor, so the track cannot move in between.
 * The step goes where `nextExtraFeedbackRoundPosition` puts it; rounds already handed over keep
 * their place. The caller has checked `projects.write` on the project.
 */
async function addExtraRoundStep(
  tx: ContactDatabaseTransaction,
  projectId: string,
  actor: WorkspaceActor,
): Promise<ExtraFeedbackRoundBlocker | null> {
  const project = await findProjectTrack(tx, projectId, undefined, {
    lock: true,
  });
  if (!project)
    throw new Error("Project of the extra feedback round is missing");
  const positions = project.feedbackRoundPositions ?? [];
  const rounds = await tx
    .select({ status: feedbackRounds.status })
    .from(feedbackRounds)
    .where(eq(feedbackRounds.project_id, projectId));
  const blocker = findExtraFeedbackRoundBlocker({ positions, rounds });
  if (blocker) return blocker;

  const nextPositions = sortFeedbackRoundPositions([
    ...positions,
    nextExtraFeedbackRoundPosition({
      processSteps: project.processSteps,
      currentProcessStep: project.currentProcessStep,
      positions,
    }),
  ]);
  await updateLockedVersioned(
    {
      tx,
      table: projects,
      id: projectId,
      expectedVersion: project.version,
      patch: {
        feedback_round_positions: nextPositions,
        included_feedback_rounds: nextPositions.length,
      },
    },
    "Locked project changed while a feedback round was added",
  );
  await activityService.createActivity(tx, {
    customerId: project.customerId,
    projectId,
    actor: { type: ActorType.User, userId: actor.userId },
    type: ActivityType.FieldChange,
    metadata: {
      entity: FEEDBACK_QUOTA_ACTIVITY_ENTITY,
      field: FEEDBACK_QUOTA_ACTIVITY_FIELD,
      previous: positions.length,
      next: nextPositions.length,
    },
  });
  return null;
}

export const feedbackRoundService = {
  addExtraRoundStep,
  findProjectTrack,
  listRounds,
  findHandOverBlocker,
  toRoundDto,
} as const;
