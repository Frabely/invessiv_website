export const LeadBadgeTone = {
  Danger: "danger",
  Info: "info",
  Neutral: "neutral",
  Primary: "primary",
  Purple: "purple",
  Success: "success",
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
  LeadBadgeTone.Warning,
] as const;
