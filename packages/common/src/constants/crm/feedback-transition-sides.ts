export const FeedbackTransitionSide = {
  Internal: "internal",
  Customer: "customer",
} as const;

export type FeedbackTransitionSide =
  (typeof FeedbackTransitionSide)[keyof typeof FeedbackTransitionSide];

export const FEEDBACK_TRANSITION_SIDE_VALUES = [
  FeedbackTransitionSide.Internal,
  FeedbackTransitionSide.Customer,
] as const;
