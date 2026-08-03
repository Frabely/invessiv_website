export const LeadPitchJobState = {
  Idle: "idle",
  Capturing: "capturing",
  Generating: "generating",
  Ready: "ready",
  Error: "error",
} as const;

export type LeadPitchJobState =
  (typeof LeadPitchJobState)[keyof typeof LeadPitchJobState];

export const LEAD_PITCH_JOB_STATE_VALUES = [
  LeadPitchJobState.Idle,
  LeadPitchJobState.Capturing,
  LeadPitchJobState.Generating,
  LeadPitchJobState.Ready,
  LeadPitchJobState.Error,
] as const;
