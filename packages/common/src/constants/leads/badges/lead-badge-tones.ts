export const LeadBadgeTone = {
  Danger: "danger",
  Info: "info",
  Neutral: "neutral",
  Primary: "primary",
  Purple: "purple",
  Success: "success",
  Orange: "orange",
  Warning: "warning",
} as const;

export type LeadBadgeTone = (typeof LeadBadgeTone)[keyof typeof LeadBadgeTone];

export const LEAD_BADGE_TONE_VALUES = [
  LeadBadgeTone.Danger,
  LeadBadgeTone.Info,
  LeadBadgeTone.Neutral,
  LeadBadgeTone.Primary,
  LeadBadgeTone.Purple,
  LeadBadgeTone.Success,
  LeadBadgeTone.Orange,
  LeadBadgeTone.Warning,
] as const;
