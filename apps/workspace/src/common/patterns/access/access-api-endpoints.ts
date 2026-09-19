import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

const MEMBER_ROLES_PATH_SEGMENT = "roles";
const MEMBER_OWNER_PATH_SEGMENT = "owner";
const ACCESS_SCOPES_PATH_SEGMENT = "access-scopes";
const ACCESS_CUSTOMER_PROJECTS_PATH_SEGMENT = "projects";

export function workspaceMemberEndpoint(memberId: string): string {
  return `${WorkspaceApiEndpoint.Members}/${encodeURIComponent(memberId)}`;
}

export function workspaceMemberRolesEndpoint(memberId: string): string {
  return `${workspaceMemberEndpoint(memberId)}/${MEMBER_ROLES_PATH_SEGMENT}`;
}

export function workspaceMemberOwnerEndpoint(memberId: string): string {
  return `${workspaceMemberEndpoint(memberId)}/${MEMBER_OWNER_PATH_SEGMENT}`;
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
  return `${WorkspaceApiEndpoint.AccessCustomers}/${encodeURIComponent(customerId)}/${ACCESS_CUSTOMER_PROJECTS_PATH_SEGMENT}`;
}

export function workspaceRoleEndpoint(roleId: string): string {
  return `${WorkspaceApiEndpoint.Roles}/${encodeURIComponent(roleId)}`;
}
