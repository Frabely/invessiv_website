export const OutreachErrorCode = {
  LeadNotFound: "LEAD_NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  NotConfigured: "NOT_CONFIGURED",
  ProviderUnavailable: "PROVIDER_UNAVAILABLE",
  Internal: "INTERNAL",
} as const;

export type OutreachErrorCode =
  (typeof OutreachErrorCode)[keyof typeof OutreachErrorCode];
