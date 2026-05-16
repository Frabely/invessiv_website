export const OutreachErrorCode = {
  LeadNotFound: "LEAD_NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  ProviderUnavailable: "PROVIDER_UNAVAILABLE",
  Internal: "INTERNAL",
} as const;

export type OutreachErrorCode =
  (typeof OutreachErrorCode)[keyof typeof OutreachErrorCode];

export const OUTREACH_ERROR_CODE_VALUES = [
  OutreachErrorCode.LeadNotFound,
  OutreachErrorCode.ValidationError,
  OutreachErrorCode.ProviderUnavailable,
  OutreachErrorCode.Internal,
] as const;
