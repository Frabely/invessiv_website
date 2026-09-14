export const BadgeTone = {
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

export type BadgeTone = (typeof BadgeTone)[keyof typeof BadgeTone];

export const BADGE_TONE_VALUES = [
  BadgeTone.Danger,
  BadgeTone.Indigo,
  BadgeTone.Info,
  BadgeTone.Neutral,
  BadgeTone.Primary,
  BadgeTone.Purple,
  BadgeTone.Success,
  BadgeTone.Orange,
  BadgeTone.Warning,
  BadgeTone.Teal,
  BadgeTone.Lime,
  BadgeTone.Fuchsia,
  BadgeTone.Coral,
  BadgeTone.Pink,
  BadgeTone.Magenta,
] as const;
