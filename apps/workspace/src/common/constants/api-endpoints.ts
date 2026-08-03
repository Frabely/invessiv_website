export const WorkspaceApiEndpoint = {
  Leads: "/api/workspace/leads",
  LeadsBulk: "/api/workspace/leads/bulk",
  LeadsImport: "/api/workspace/leads/import",
  OutreachPitch: "/api/workspace/outreach/pitch",
  OutreachProviderStatus: "/api/workspace/outreach/provider-status",
} as const;

export type WorkspaceApiEndpoint =
  (typeof WorkspaceApiEndpoint)[keyof typeof WorkspaceApiEndpoint];
