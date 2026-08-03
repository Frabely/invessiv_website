export const LeadPitchPanelVariant = {
  Compact: "compact",
  Popover: "popover",
} as const;

export type LeadPitchPanelVariant =
  (typeof LeadPitchPanelVariant)[keyof typeof LeadPitchPanelVariant];
