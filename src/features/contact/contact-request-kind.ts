export const CONTACT_REQUEST_KINDS = [
  "project_request",
  "quick_contact",
  "discovery_call",
] as const;

export const CONTACT_SUBMISSION_CHANNELS = CONTACT_REQUEST_KINDS;

export type ContactRequestKind = (typeof CONTACT_REQUEST_KINDS)[number];

export type ContactSubmissionChannel =
  (typeof CONTACT_SUBMISSION_CHANNELS)[number];
