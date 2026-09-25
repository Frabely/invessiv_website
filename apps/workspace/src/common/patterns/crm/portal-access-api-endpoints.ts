import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

export const portalAccessApiEndpoints = {
  customer: (customerId: string) =>
    `${WorkspaceApiEndpoint.CrmCustomers}/${encodeURIComponent(customerId)}/portal-access`,
  invite: (customerId: string) =>
    `${WorkspaceApiEndpoint.CrmCustomers}/${encodeURIComponent(customerId)}/portal-invitations`,
  preview: (customerId: string) =>
    `${WorkspaceApiEndpoint.CrmCustomers}/${encodeURIComponent(customerId)}/portal-preview`,
  membership: (id: string) =>
    `${WorkspaceApiEndpoint.CrmPortalMemberships}/${encodeURIComponent(id)}`,
  membershipRoles: (id: string) =>
    `${WorkspaceApiEndpoint.CrmPortalMemberships}/${encodeURIComponent(id)}/roles`,
  invitation: (id: string) =>
    `${WorkspaceApiEndpoint.CrmPortalInvitations}/${encodeURIComponent(id)}`,
} as const;
