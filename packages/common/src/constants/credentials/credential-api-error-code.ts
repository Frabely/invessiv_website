export const CredentialApiErrorCode = {
  NotFound: "not_found",
  Validation: "validation",
  NotConfigured: "not_configured",
  RateLimited: "rate_limited",
  /** The customer created the entry; its portal release cannot be withdrawn. */
  CustomerOwned: "customer_owned",
  /** The entry's project is not shown in the portal, so a release would have no effect. */
  ProjectHidden: "project_hidden",
  Internal: "internal",
} as const;

export type CredentialApiErrorCode =
  (typeof CredentialApiErrorCode)[keyof typeof CredentialApiErrorCode];

export const CREDENTIAL_API_ERROR_CODE_VALUES = [
  CredentialApiErrorCode.NotFound,
  CredentialApiErrorCode.Validation,
  CredentialApiErrorCode.NotConfigured,
  CredentialApiErrorCode.RateLimited,
  CredentialApiErrorCode.CustomerOwned,
  CredentialApiErrorCode.ProjectHidden,
  CredentialApiErrorCode.Internal,
] as const;
