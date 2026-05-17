export const GENERATE_ENDPOINT = "/api/workspace/outreach/generate";
export const PROVIDER_STATUS_ENDPOINT =
  "/api/workspace/outreach/provider-status";

export const LeadOutreachApiEndpoints = {
  Generate: GENERATE_ENDPOINT,
  ProviderStatus: PROVIDER_STATUS_ENDPOINT,
} as const;
