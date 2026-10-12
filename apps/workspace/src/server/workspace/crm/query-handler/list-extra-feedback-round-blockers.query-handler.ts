import "server-only";
import type { ExtraFeedbackRoundBlocker } from "@invessiv/common/constants/crm/extra-feedback-round-blockers";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { FeedbackRoundTrackInput } from "@/server/shared/services/feedback/feedback-service-types";
import { loadExtraFeedbackRoundBlockers } from "@/server/shared/services/feedback/load-extra-feedback-round-blockers";

/**
 * Says for each given project whether it can take a further feedback round. The caller passes
 * only projects it has already read through its own access scope; the rule itself is shared with
 * the portal (`loadExtraFeedbackRoundBlockers`), so the dialog and the assignment never disagree.
 */
export async function listExtraFeedbackRoundBlockers(
  projects: readonly FeedbackRoundTrackInput[],
): Promise<Map<string, ExtraFeedbackRoundBlocker | null>> {
  return loadExtraFeedbackRoundBlockers(getDrizzleDatabaseClient(), projects);
}
