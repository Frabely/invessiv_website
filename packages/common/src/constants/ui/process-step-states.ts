export const ProcessStepState = {
  Complete: "complete",
  Current: "current",
  Upcoming: "upcoming",
} as const;

export type ProcessStepState =
  (typeof ProcessStepState)[keyof typeof ProcessStepState];
