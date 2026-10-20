export const FeedbackClarificationStatus = {
  Open: "open",
  Answered: "answered",
  Closed: "closed",
} as const;
export type FeedbackClarificationStatus =
  (typeof FeedbackClarificationStatus)[keyof typeof FeedbackClarificationStatus];
export const FEEDBACK_CLARIFICATION_STATUS_VALUES = [
  FeedbackClarificationStatus.Open,
  FeedbackClarificationStatus.Answered,
  FeedbackClarificationStatus.Closed,
] as const;
