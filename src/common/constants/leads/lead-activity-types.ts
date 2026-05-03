export const LEAD_ACTIVITY_TYPES = [
  "note",
  "status_change",
  "inbound_submission",
  "import",
] as const;

export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];
