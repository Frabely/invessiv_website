/**
 * What the fill of a step says about it, for tracks whose steps report their own state. The tone
 * only picks the colour; a track always pairs it with an icon and a spoken status.
 */
export const ProcessStepTone = {
  Neutral: "neutral",
  Info: "info",
  Success: "success",
  Danger: "danger",
} as const;

export type ProcessStepTone =
  (typeof ProcessStepTone)[keyof typeof ProcessStepTone];

export const PROCESS_STEP_TONE_VALUES = [
  ProcessStepTone.Neutral,
  ProcessStepTone.Info,
  ProcessStepTone.Success,
  ProcessStepTone.Danger,
] as const;
