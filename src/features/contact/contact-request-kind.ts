export const CONTACT_REQUEST_KINDS = [
  "project_request",
  "quick_contact",
] as const;

export type ContactRequestKind = (typeof CONTACT_REQUEST_KINDS)[number];
