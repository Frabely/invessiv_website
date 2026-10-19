import type { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { FeedbackItemProcessingState } from "@invessiv/common/constants/crm/feedback-item-processing-states";
import type { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { findOpenFeedbackClarification } from "./find-open-feedback-clarification";
export function getFeedbackItemProcessingState(item: {
  result: FeedbackItemResult | null;
  clarifications: readonly { status: FeedbackClarificationStatus }[];
}): FeedbackItemProcessingState {
  return findOpenFeedbackClarification(item.clarifications)
    ? FeedbackItemProcessingState.Clarification
    : (item.result ?? FeedbackItemProcessingState.Pending);
}
