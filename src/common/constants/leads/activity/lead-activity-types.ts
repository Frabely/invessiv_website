export const LeadActivityType = {
  Note: "note",
  StatusChange: "status_change",
  InboundSubmission: "inbound_submission",
  Import: "import",
} as const;

export type LeadActivityType =
  (typeof LeadActivityType)[keyof typeof LeadActivityType];

export const LEAD_ACTIVITY_TYPE_VALUES = [
  LeadActivityType.Note,
  LeadActivityType.StatusChange,
  LeadActivityType.InboundSubmission,
  LeadActivityType.Import,
] as const;
