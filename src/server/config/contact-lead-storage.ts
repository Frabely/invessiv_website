import "server-only";

export const CONTACT_LEAD_STORAGE = {
  defaultLeadStatus: "new",
  defaultMailProvider: "resend",
  defaultMailStatus: "pending",
  retentionMonths: 24,
  sourceForm: "project_request",
} as const;

export type ContactLeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "won"
  | "lost"
  | "archived";
