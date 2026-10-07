/** Grouping and icon only; no behaviour depends on the type. */
export const CredentialType = {
  DomainRegistrar: "domain_registrar",
  Hosting: "hosting",
  Email: "email",
  Cms: "cms",
  Database: "database",
  Analytics: "analytics",
  ApiService: "api_service",
  Other: "other",
} as const;

export type CredentialType =
  (typeof CredentialType)[keyof typeof CredentialType];

export const CREDENTIAL_TYPE_VALUES = [
  CredentialType.DomainRegistrar,
  CredentialType.Hosting,
  CredentialType.Email,
  CredentialType.Cms,
  CredentialType.Database,
  CredentialType.Analytics,
  CredentialType.ApiService,
  CredentialType.Other,
] as const;
