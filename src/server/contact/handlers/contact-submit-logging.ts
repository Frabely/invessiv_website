export const CONTACT_SUBMIT_LOG_PREFIX = {
  DiscoveryCall: "submit-discovery-call",
  ProjectRequest: "submit-project-request",
  QuickContact: "submit-quick-contact",
} as const;

export const CONTACT_SUBMIT_LOG_MESSAGE = {
  MailDeliveryFailed: "mail delivery failed",
  PersistenceFailed: "persistence failed",
} as const;
