export const CredentialApiErrorCode = {
  NotFound: "not_found",
  Validation: "validation",
  NotConfigured: "not_configured",
  RateLimited: "rate_limited",
  Internal: "internal",
} as const;

export type CredentialApiErrorCode =
  (typeof CredentialApiErrorCode)[keyof typeof CredentialApiErrorCode];

export const CREDENTIAL_API_ERROR_CODE_VALUES = [
  CredentialApiErrorCode.NotFound,
  CredentialApiErrorCode.Validation,
  CredentialApiErrorCode.NotConfigured,
  CredentialApiErrorCode.RateLimited,
  CredentialApiErrorCode.Internal,
] as const;
