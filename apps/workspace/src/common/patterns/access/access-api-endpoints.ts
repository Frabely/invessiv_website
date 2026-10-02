import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { ProjectApiPath } from "@/common/constants/crm/project-api-paths";

const MEMBER_ROLES_PATH_SEGMENT = "roles";
const MEMBER_ROLE_ASSIGNMENTS_PATH_SEGMENT = "role-assignments";
const MEMBER_OWNER_PATH_SEGMENT = "owner";
const ACCESS_SCOPES_PATH_SEGMENT = "access-scopes";
const BOOKING_URL_PATH_SEGMENT = "booking-url";
const OWN_MEMBER_PATH_SEGMENT = "me";

export function workspaceMemberEndpoint(memberId: string): string {
  return `${WorkspaceApiEndpoint.Members}/${encodeURIComponent(memberId)}`;
}

export function workspaceMemberRolesEndpoint(memberId: string): string {
  return `${workspaceMemberEndpoint(memberId)}/${MEMBER_ROLES_PATH_SEGMENT}`;
}

export function workspaceMemberRoleAssignmentsEndpoint(
  memberId: string,
): string {
  return `${workspaceMemberEndpoint(memberId)}/${MEMBER_ROLE_ASSIGNMENTS_PATH_SEGMENT}`;
}

export function workspaceMemberOwnerEndpoint(memberId: string): string {
  return `${workspaceMemberEndpoint(memberId)}/${MEMBER_OWNER_PATH_SEGMENT}`;
}

export function workspaceMemberBookingUrlEndpoint(memberId: string): string {
  return `${workspaceMemberEndpoint(memberId)}/${BOOKING_URL_PATH_SEGMENT}`;
}

/** The signed-in member's own link; the server takes the member from the session. */
export function ownBookingUrlEndpoint(): string {
  return `${WorkspaceApiEndpoint.Members}/${OWN_MEMBER_PATH_SEGMENT}/${BOOKING_URL_PATH_SEGMENT}`;
}

export function workspaceMemberAccessScopesEndpoint(memberId: string): string {
  return `${workspaceMemberEndpoint(memberId)}/${ACCESS_SCOPES_PATH_SEGMENT}`;
}

export function workspaceMemberAccessScopeEndpoint(
  memberId: string,
  scopeId: string,
): string {
  return `${workspaceMemberAccessScopesEndpoint(memberId)}/${encodeURIComponent(scopeId)}`;
}

export function accessCustomerProjectsEndpoint(customerId: string): string {
  return `${WorkspaceApiEndpoint.AccessCustomers}/${encodeURIComponent(customerId)}/${ProjectApiPath.Projects}`;
}

export function accessCustomersEndpoint(search: string): string {
  const query = new URLSearchParams({ search });
  return `${WorkspaceApiEndpoint.AccessCustomers}?${query.toString()}`;
}

export function accessCustomerOptionsEndpoint(): string {
  return WorkspaceApiEndpoint.AccessCustomerOptions;
}

export function crmCustomerAccessScopesEndpoint(customerId: string): string {
  return `${WorkspaceApiEndpoint.CrmCustomers}/${encodeURIComponent(customerId)}/${ACCESS_SCOPES_PATH_SEGMENT}`;
}

export function workspaceRoleEndpoint(roleId: string): string {
  return `${WorkspaceApiEndpoint.Roles}/${encodeURIComponent(roleId)}`;
}
