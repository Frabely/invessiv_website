/**
 * How far a step is done on its own, for tracks whose steps may be skipped. Without it a track
 * derives the look of a step from its position before or after the current one.
 */
export const ProcessStepProgress = {
  Empty: "empty",
  Partial: "partial",
  Complete: "complete",
} as const;

export type ProcessStepProgress =
  (typeof ProcessStepProgress)[keyof typeof ProcessStepProgress];

export const PROCESS_STEP_PROGRESS_VALUES = [
  ProcessStepProgress.Empty,
  ProcessStepProgress.Partial,
  ProcessStepProgress.Complete,
] as const;
