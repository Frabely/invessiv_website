export const LeadBadgeTone = {
  Danger: "danger",
  Indigo: "indigo",
  Info: "info",
  Neutral: "neutral",
  Primary: "primary",
  Purple: "purple",
  Success: "success",
  Orange: "orange",
  Warning: "warning",
  Teal: "teal",
  Lime: "lime",
  Fuchsia: "fuchsia",
  Coral: "coral",
  Pink: "pink",
  Magenta: "magenta",
} as const;

export type LeadBadgeTone = (typeof LeadBadgeTone)[keyof typeof LeadBadgeTone];

export const LEAD_BADGE_TONE_VALUES = [
  LeadBadgeTone.Danger,
  LeadBadgeTone.Indigo,
  LeadBadgeTone.Info,
  LeadBadgeTone.Neutral,
  LeadBadgeTone.Primary,
  LeadBadgeTone.Purple,
  LeadBadgeTone.Success,
  LeadBadgeTone.Orange,
  LeadBadgeTone.Warning,
  LeadBadgeTone.Teal,
  LeadBadgeTone.Lime,
  LeadBadgeTone.Fuchsia,
  LeadBadgeTone.Coral,
  LeadBadgeTone.Pink,
  LeadBadgeTone.Magenta,
] as const;
