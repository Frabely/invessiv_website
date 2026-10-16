/** What a step of the portal feedback track stands for. */
export const FeedbackRoundStepKind = {
  /** A round that was handed over; it can be opened. */
  Round: "round",
  /** A round included in the quota that was not handed over yet. */
  Upcoming: "upcoming",
  /** A round that will not happen because the project was approved before it. */
  Expired: "expired",
} as const;

export type FeedbackRoundStepKind =
  (typeof FeedbackRoundStepKind)[keyof typeof FeedbackRoundStepKind];

export const FEEDBACK_ROUND_STEP_KIND_VALUES = [
  FeedbackRoundStepKind.Round,
  FeedbackRoundStepKind.Upcoming,
  FeedbackRoundStepKind.Expired,
] as const;
