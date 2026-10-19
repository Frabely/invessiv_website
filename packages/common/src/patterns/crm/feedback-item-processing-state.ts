import { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { FeedbackItemProcessingState } from "@invessiv/common/constants/crm/feedback-item-processing-states";
import type { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
export function getFeedbackItemProcessingState(item: {
  result: FeedbackItemResult | null;
  clarifications: readonly { status: FeedbackClarificationStatus }[];
}): FeedbackItemProcessingState {
  return item.clarifications.some(
    (question) => question.status === FeedbackClarificationStatus.Open,
  )
    ? FeedbackItemProcessingState.Clarification
    : (item.result ?? FeedbackItemProcessingState.Pending);
}
