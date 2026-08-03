export const PitchChannel = {
  Instagram: "instagram",
  Linkedin: "linkedin",
} as const;

export type PitchChannel = (typeof PitchChannel)[keyof typeof PitchChannel];

export const PITCH_CHANNEL_VALUES = [
  PitchChannel.Instagram,
  PitchChannel.Linkedin,
] as const;
