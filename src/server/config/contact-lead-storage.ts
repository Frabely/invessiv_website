import "server-only";

export const CONTACT_LEAD_STORAGE = {
  defaultLeadStatus: "new",
  defaultMailProvider: "resend",
  defaultMailStatus: "pending",
  retentionMonths: 24,
  sourceForm: "project_request",
} as const;

export const LEGAL_DOCUMENT_VERSIONS = {
  privacy: "2026-03-26",
  terms: "2026-03-26",
} as const;

export type ContactLeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "won"
  | "lost"
  | "archived";

export type ContactLeadMailStatus = "pending" | "sent" | "failed";
