export const FeedbackRoundStatus = {
  Open: "open",
  Submitted: "submitted",
  InDiscussion: "in_discussion",
  InProgress: "in_progress",
  Completed: "completed",
  Approved: "approved",
} as const;

export type FeedbackRoundStatus =
  (typeof FeedbackRoundStatus)[keyof typeof FeedbackRoundStatus];

export const FEEDBACK_ROUND_STATUS_VALUES = [
  FeedbackRoundStatus.Open,
  FeedbackRoundStatus.Submitted,
  FeedbackRoundStatus.InDiscussion,
  FeedbackRoundStatus.InProgress,
  FeedbackRoundStatus.Completed,
  FeedbackRoundStatus.Approved,
] as const;

/** At most one round per project may be in one of these; a partial unique index enforces it. */
export const ACTIVE_FEEDBACK_ROUND_STATUS_VALUES = [
  FeedbackRoundStatus.Open,
  FeedbackRoundStatus.Submitted,
  FeedbackRoundStatus.InDiscussion,
  FeedbackRoundStatus.InProgress,
] as const;

/** Rounds the team has to act on; they feed the internal feedback inbox. */
export const INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES = [
  FeedbackRoundStatus.Submitted,
  FeedbackRoundStatus.InDiscussion,
  FeedbackRoundStatus.InProgress,
] as const;

/** Only from these statuses may the customer see item results and replies. */
export const RESULT_VISIBLE_FEEDBACK_ROUND_STATUS_VALUES = [
  FeedbackRoundStatus.Completed,
  FeedbackRoundStatus.Approved,
] as const;
