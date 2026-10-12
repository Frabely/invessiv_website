import "server-only";
import { inArray } from "drizzle-orm";
import type { ExtraFeedbackRoundBlocker } from "@invessiv/common/constants/crm/extra-feedback-round-blockers";
import type { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { findExtraFeedbackRoundBlocker } from "@invessiv/common/patterns/crm/extra-feedback-round";
import type { ContactDatabaseReader } from "@invessiv/db/core";
import { feedbackRounds } from "@invessiv/db/record-configuration";
import type { FeedbackRoundTrackInput } from "./feedback-service-types";

/**
 * Says for each given project whether it can take a further feedback round. The caller passes
 * only projects it has already read through its own access rules; this adds the round statuses
 * and applies the one shared rule, so cockpit, assignment and portal never disagree.
 */
export async function loadExtraFeedbackRoundBlockers(
  executor: ContactDatabaseReader,
  projects: readonly FeedbackRoundTrackInput[],
): Promise<Map<string, ExtraFeedbackRoundBlocker | null>> {
  if (projects.length === 0) return new Map();
  const rounds = await executor
    .select({
      projectId: feedbackRounds.project_id,
      status: feedbackRounds.status,
    })
    .from(feedbackRounds)
    .where(
      inArray(
        feedbackRounds.project_id,
        projects.map((project) => project.id),
      ),
    );
  const statusesByProject = new Map<
    string,
    { status: FeedbackRoundStatus }[]
  >();
  for (const round of rounds) {
    const statuses = statusesByProject.get(round.projectId) ?? [];
    statuses.push({ status: round.status });
    statusesByProject.set(round.projectId, statuses);
  }
  return new Map(
    projects.map((project) => [
      project.id,
      findExtraFeedbackRoundBlocker({
        positions: project.positions,
        rounds: statusesByProject.get(project.id) ?? [],
      }),
    ]),
  );
}
