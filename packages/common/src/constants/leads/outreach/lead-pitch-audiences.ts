export const PitchAudience = {
  Single: "single",
  Team: "team",
} as const;

export type PitchAudience = (typeof PitchAudience)[keyof typeof PitchAudience];

export const PITCH_AUDIENCE_VALUES = [
  PitchAudience.Single,
  PitchAudience.Team,
] as const;
