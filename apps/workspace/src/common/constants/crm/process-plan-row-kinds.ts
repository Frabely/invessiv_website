export const ProcessPlanRowKind = {
  CustomStep: "custom_step",
  FeedbackRound: "feedback_round",
} as const;

export type ProcessPlanRowKind =
  (typeof ProcessPlanRowKind)[keyof typeof ProcessPlanRowKind];
