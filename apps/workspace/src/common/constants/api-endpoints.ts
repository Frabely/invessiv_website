export const WorkspaceApiEndpoint = {
  CrmCustomers: "/api/workspace/crm/customers",
  CrmLeadConversions: "/api/workspace/crm/leads",
  CrmProjects: "/api/workspace/crm/projects",
  Leads: "/api/workspace/leads",
  LeadsBulk: "/api/workspace/leads/bulk",
  LeadsImport: "/api/workspace/leads/import",
  Members: "/api/workspace/members",
  MembersClerkCandidates: "/api/workspace/members/clerk-candidates",
  OutreachGenerate: "/api/workspace/outreach/generate",
  OutreachProviderStatus: "/api/workspace/outreach/provider-status",
  Roles: "/api/workspace/roles",
} as const;

export type WorkspaceApiEndpoint =
  (typeof WorkspaceApiEndpoint)[keyof typeof WorkspaceApiEndpoint];
