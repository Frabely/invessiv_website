import type { Locale } from "@/config/i18n";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { PortalAccessApiSegment } from "@/common/constants/crm/portal-access-api-segments";

export const portalAccessApiEndpoints = {
  customer: (customerId: string) =>
    `${WorkspaceApiEndpoint.CrmCustomers}/${encodeURIComponent(customerId)}/${PortalAccessApiSegment.Access}`,
  invite: (customerId: string, locale: Locale) => {
    const query = new URLSearchParams({ locale });
    return `${WorkspaceApiEndpoint.CrmCustomers}/${encodeURIComponent(customerId)}/${PortalAccessApiSegment.Invitations}?${query.toString()}`;
  },
  preview: (customerId: string) =>
    `${WorkspaceApiEndpoint.CrmCustomers}/${encodeURIComponent(customerId)}/${PortalAccessApiSegment.Preview}`,
  membership: (id: string) =>
    `${WorkspaceApiEndpoint.CrmPortalMemberships}/${encodeURIComponent(id)}`,
  membershipRoles: (id: string) =>
    `${WorkspaceApiEndpoint.CrmPortalMemberships}/${encodeURIComponent(id)}/${PortalAccessApiSegment.Roles}`,
  invitation: (id: string) =>
    `${WorkspaceApiEndpoint.CrmPortalInvitations}/${encodeURIComponent(id)}`,
} as const;
