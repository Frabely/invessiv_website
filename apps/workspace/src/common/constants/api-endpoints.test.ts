import { describe, expect, it } from "vitest";

import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

describe("WorkspaceApiEndpoint", () => {
  it("exposes the exact workspace api endpoints", () => {
    expect(WorkspaceApiEndpoint).toEqual({
      CrmCustomers: "/api/workspace/crm/customers",
      CrmLeadConversions: "/api/workspace/crm/leads",
      CrmProjects: "/api/workspace/crm/projects",
      CrmServiceTemplates: "/api/workspace/crm/service-templates",
      Leads: "/api/workspace/leads",
      LeadsBulk: "/api/workspace/leads/bulk",
      LeadsImport: "/api/workspace/leads/import",
      Members: "/api/workspace/members",
      MembersClerkCandidates: "/api/workspace/members/clerk-candidates",
      OutreachGenerate: "/api/workspace/outreach/generate",
      OutreachProviderStatus: "/api/workspace/outreach/provider-status",
      Roles: "/api/workspace/roles",
    });
  });

  it("has no duplicate endpoint values", () => {
    const values = Object.values(WorkspaceApiEndpoint);
    expect(new Set(values).size).toBe(values.length);
  });
});
