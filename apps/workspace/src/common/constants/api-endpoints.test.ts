import { describe, expect, it } from "vitest";

import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

describe("WorkspaceApiEndpoint", () => {
  it("exposes the exact workspace api endpoints", () => {
    expect(WorkspaceApiEndpoint).toEqual({
      Leads: "/api/workspace/leads",
      LeadsBulk: "/api/workspace/leads/bulk",
      LeadsImport: "/api/workspace/leads/import",
      OutreachPitch: "/api/workspace/outreach/pitch",
      OutreachProviderStatus: "/api/workspace/outreach/provider-status",
    });
  });

  it("has no duplicate endpoint values", () => {
    const values = Object.values(WorkspaceApiEndpoint);
    expect(new Set(values).size).toBe(values.length);
  });
});
