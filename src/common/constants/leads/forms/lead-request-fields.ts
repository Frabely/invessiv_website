export const LeadRequestField = {
  DisplayName: "displayName",
  Email: "email",
  LeadStatus: "lead_status",
} as const;

export type LeadRequestField =
  (typeof LeadRequestField)[keyof typeof LeadRequestField];

export const LEAD_REQUEST_FIELD_VALUES = [
  LeadRequestField.DisplayName,
  LeadRequestField.Email,
  LeadRequestField.LeadStatus,
] as const;
