import { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";

/** The one question on an item that still waits; at most one is open at a time. */
export function findOpenFeedbackClarification<
  TClarification extends { status: FeedbackClarificationStatus },
>(clarifications: readonly TClarification[]): TClarification | undefined {
  return clarifications.find(
    (clarification) =>
      clarification.status === FeedbackClarificationStatus.Open,
  );
}
