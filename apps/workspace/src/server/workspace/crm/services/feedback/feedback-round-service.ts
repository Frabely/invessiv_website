import "server-only";

import { and, desc, eq, type SQL, sql } from "drizzle-orm";

import type { FeedbackHandOverBlocker } from "@invessiv/common/constants/crm/feedback-hand-over-blockers";
import { findFeedbackHandOverBlocker } from "@invessiv/common/patterns/crm/feedback-hand-over-blocker";
import {
  feedbackRoundItems,
  feedbackRounds,
  projects,
} from "@invessiv/db/record-configuration";
import type { FeedbackReadExecutor } from "@/server/shared/services/feedback/feedback-service-types";
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
  executor: FeedbackReadExecutor,
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
  executor: FeedbackReadExecutor,
  projectId: string,
): Promise<CountedFeedbackRound[]> {
  return executor
    .select({
      round: feedbackRounds,
      itemCount:
        sql<number>`(select count(*) from ${feedbackRoundItems} where ${feedbackRoundItems.round_id} = ${feedbackRounds.id})`.mapWith(
          Number,
        ),
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

export const feedbackRoundService = {
  findProjectTrack,
  listRounds,
  findHandOverBlocker,
} as const;
