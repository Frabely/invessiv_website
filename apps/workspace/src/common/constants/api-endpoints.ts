export const WorkspaceApiEndpoint = {
  AccessCustomers: "/api/workspace/access/customers",
  AccessCustomerOptions: "/api/workspace/access/customers/options",
  CrmCustomers: "/api/workspace/crm/customers",
  CrmPortalMemberships: "/api/workspace/crm/portal-memberships",
  CrmPortalInvitations: "/api/workspace/crm/portal-invitations",
  Portal: "/api/portal",
  PortalInvitationRedeem: "/api/portal/invitations/redeem",
  CrmLeadConversions: "/api/workspace/crm/leads",
  CrmProjects: "/api/workspace/crm/projects",
  CrmProjectLineItems: "/api/workspace/crm/project-line-items",
  CrmLineItemTemplates: "/api/workspace/crm/line-item-templates",
  CrmTasks: "/api/workspace/crm/tasks",
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
