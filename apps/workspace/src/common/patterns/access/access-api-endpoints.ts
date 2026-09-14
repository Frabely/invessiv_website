import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

const MEMBER_ROLES_PATH_SEGMENT = "roles";
const MEMBER_OWNER_PATH_SEGMENT = "owner";

export function workspaceMemberEndpoint(memberId: string): string {
  return `${WorkspaceApiEndpoint.Members}/${encodeURIComponent(memberId)}`;
}

export function workspaceMemberRolesEndpoint(memberId: string): string {
  return `${workspaceMemberEndpoint(memberId)}/${MEMBER_ROLES_PATH_SEGMENT}`;
}

export function workspaceMemberOwnerEndpoint(memberId: string): string {
  return `${workspaceMemberEndpoint(memberId)}/${MEMBER_OWNER_PATH_SEGMENT}`;
}

export function workspaceRoleEndpoint(roleId: string): string {
  return `${WorkspaceApiEndpoint.Roles}/${encodeURIComponent(roleId)}`;
}
