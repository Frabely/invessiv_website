export const LEAD_STATUS_TABS = [
  "all",
  "new",
  "qualified",
  "proposal",
  "won",
] as const;

export type LeadStatusTab = (typeof LEAD_STATUS_TABS)[number];
