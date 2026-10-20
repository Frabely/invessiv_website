import type { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { FeedbackItemProcessingState } from "@invessiv/common/constants/crm/feedback-item-processing-states";
import type { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { getFeedbackItemProcessingState } from "@invessiv/common/patterns/crm/feedback-item-processing-state";
import type { FeedbackProcessingSummary } from "@/common/contracts/crm/feedback-processing-summary";

type ProcessedItem = {
  result: FeedbackItemResult | null;
  clarifications: readonly { status: FeedbackClarificationStatus }[];
};

/** Progress, completion check and every other count read the same processing state per item. */
export function summarizeFeedbackProcessing(
  items: readonly ProcessedItem[],
): FeedbackProcessingSummary {
  const summary: FeedbackProcessingSummary = {
    done: 0,
    pending: 0,
    clarifications: 0,
    total: items.length,
  };
  for (const item of items) {
    const state = getFeedbackItemProcessingState(item);
    if (state === FeedbackItemProcessingState.Clarification)
      summary.clarifications += 1;
    else if (state === FeedbackItemProcessingState.Pending)
      summary.pending += 1;
    else summary.done += 1;
  }
  return summary;
}
