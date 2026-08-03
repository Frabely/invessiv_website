export const LeadPitchErrorCode = {
  LeadNotFound: "LEAD_NOT_FOUND",
  NoProfileData: "NO_PROFILE_DATA",
  IcebreakerTooLong: "ICEBREAKER_TOO_LONG",
  TemplateInvalid: "TEMPLATE_INVALID",
  ValidationError: "VALIDATION_ERROR",
  NotConfigured: "NOT_CONFIGURED",
  AuthenticationFailed: "PROVIDER_AUTHENTICATION_FAILED",
  ModelUnavailable: "PROVIDER_MODEL_UNAVAILABLE",
  ProviderRateLimited: "PROVIDER_RATE_LIMITED",
  ProviderRejected: "PROVIDER_REJECTED",
  ProviderInvalidResponse: "PROVIDER_INVALID_RESPONSE",
  ProviderUnavailable: "PROVIDER_UNAVAILABLE",
  Internal: "PITCH_INTERNAL",
} as const;

export type LeadPitchErrorCode =
  (typeof LeadPitchErrorCode)[keyof typeof LeadPitchErrorCode];
