export const LinkedInPostGeneratorUsageLimitUnavailableReason = {
  RequestIpMissing: "usage_limit_request_ip_missing",
  SecretMissing: "usage_limit_secret_missing",
  StorageUnavailable: "usage_limit_storage_unavailable",
} as const;

export type LinkedInPostGeneratorUsageLimitUnavailableReason =
  (typeof LinkedInPostGeneratorUsageLimitUnavailableReason)[keyof typeof LinkedInPostGeneratorUsageLimitUnavailableReason];
