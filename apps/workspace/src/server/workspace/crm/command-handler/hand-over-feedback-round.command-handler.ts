import "server-only";

import type { z } from "zod";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackHandOverBlocker } from "@invessiv/common/constants/crm/feedback-hand-over-blockers";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { HandOverFeedbackRoundRequestDto } from "@invessiv/common/contracts/crm/hand-over-feedback-round-request.dto";
import type { HandOverFeedbackRoundResult } from "@invessiv/common/contracts/crm/results/hand-over-feedback-round-result";
import { sameSequence } from "@invessiv/common/patterns/collections/same-sequence";
import { isActiveFeedbackRound } from "@invessiv/common/patterns/crm/feedback-round-state";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { feedbackRounds, projects } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { feedbackRoundWriteService } from "@/server/shared/services/feedback/feedback-round-write-service";
import type { FeedbackRoundRow } from "@/server/shared/services/feedback/feedback-service-types";
import { feedbackRoundMappingService } from "@/server/workspace/crm/services/feedback/feedback-round-mapping-service";
import { feedbackRoundSchemas } from "@/server/workspace/crm/services/feedback/feedback-round-schemas";
import { feedbackRoundService } from "@/server/workspace/crm/services/feedback/feedback-round-service";
import type {
  CountedFeedbackRound,
  FeedbackProjectTrack,
} from "@/server/workspace/crm/services/feedback/feedback-round-types";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";

type HandOverInput = z.output<typeof feedbackRoundSchemas.handOver>;

const PROJECT_NOT_FOUND = {
  ok: false,
  code: FeedbackRoundErrorCode.ProjectNotFound,
} as const;

/** Round numbers are gapless and the list is newest first, so the next number follows the first. */
async function insertRound(
  tx: ContactDatabaseTransaction,
  project: FeedbackProjectTrack,
  rounds: readonly CountedFeedbackRound[],
  input: HandOverInput,
  actor: WorkspaceActor,
): Promise<FeedbackRoundRow> {
  const [round] = await tx
    .insert(feedbackRounds)
    .values({
      id: crypto.randomUUID(),
      project_id: project.id,
      customer_id: project.customerId,
      round_number: (rounds[0]?.round.round_number ?? 0) + 1,
      status: FeedbackRoundStatus.Open,
      preview_url: input.previewUrl,
      handover_note: input.handoverNote,
      due_on: input.dueOn,
      area_options: input.areaOptions,
      handed_over_by_member_id: actor.workspaceMemberId,
      handed_over_at: new Date(),
      version: 1,
    })
    .returning();
  return round;
}

/** The dialog edits the project's area list; the round keeps its own snapshot of it. */
async function saveProjectAreas(
  tx: ContactDatabaseTransaction,
  project: FeedbackProjectTrack,
  areas: readonly string[],
): Promise<void> {
  if (sameSequence(areas, project.feedbackAreas)) return;
  await updateLockedVersioned(
    {
      tx,
      table: projects,
      id: project.id,
      expectedVersion: project.version,
      patch: { feedback_areas: [...areas] },
    },
    "Locked feedback round project changed",
  );
}

function rejectBlocked(
  project: FeedbackProjectTrack,
  rounds: readonly CountedFeedbackRound[],
): HandOverFeedbackRoundResult | null {
  const blocker = feedbackRoundService.findHandOverBlocker(project, rounds);
  if (blocker === null) return null;
  const active = rounds.find(({ round }) =>
    isActiveFeedbackRound(round.status),
  );
  if (blocker === FeedbackHandOverBlocker.RoundAlreadyActive && active)
    return {
      ok: false,
      code: blocker,
      activeRound: feedbackRoundMappingService.toSummaryDto(
        active.round,
        active.itemCount,
      ),
    };
  if (blocker === FeedbackHandOverBlocker.RoundAlreadyActive)
    throw new Error("Active feedback round disappeared under the project lock");
  return { ok: false, code: blocker };
}

/**
 * Creates round n + 1 under the project lock. The lock is the one the project editor takes, so two
 * parallel handovers serialize: the second one sees the new round and answers with it. Phase and
 * current step stay untouched; the chat notice runs in a savepoint.
 */
export async function handOverFeedbackRound(
  projectId: string,
  input: HandOverFeedbackRoundRequestDto,
  actor: WorkspaceActor,
): Promise<HandOverFeedbackRoundResult> {
  if (!feedbackRoundSchemas.entityId.safeParse(projectId).success)
    return PROJECT_NOT_FOUND;
  const parsed = feedbackRoundSchemas.handOver.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      code: FeedbackRoundErrorCode.ValidationError,
      errors: parsed.error.issues,
    };

  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const project = await feedbackRoundService.findProjectTrack(
      tx,
      projectId,
      crmAccessCondition.forScope(
        accessScope(actor, Permission.ProjectsWrite),
        { customerId: projects.customer_id, projectId: projects.id },
      ),
      { lock: true },
    );
    if (
      !project ||
      !canOn(actor, Permission.ProjectsWrite, {
        customerId: project.customerId,
        projectId: project.id,
      })
    )
      return PROJECT_NOT_FOUND;
    const rounds = await feedbackRoundService.listRounds(tx, project.id);
    const rejected = rejectBlocked(project, rounds);
    if (rejected) return rejected;

    const round = await insertRound(tx, project, rounds, parsed.data, actor);
    await saveProjectAreas(tx, project, parsed.data.areaOptions);
    await feedbackRoundWriteService.recordHandOver(tx, round, {
      actor: { type: ActorType.User, userId: actor.userId },
      projectTitle: project.title,
    });
    return { ok: true, round: feedbackRoundMappingService.toDto(round, []) };
  });
}
