import { describe, expect, it } from "vitest";
import { LeadOutreachApiEndpoints } from "./lead-outreach-api-endpoints";

describe("LeadOutreachApiEndpoints", () => {
  it("keeps the outreach API endpoints stable", () => {
    expect(LeadOutreachApiEndpoints).toEqual({
      Generate: "/api/workspace/outreach/generate",
      ProviderStatus: "/api/workspace/outreach/provider-status",
    });
  });
});
