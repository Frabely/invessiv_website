import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

const MEMBER_ROLES_PATH_SEGMENT = "roles";
const MEMBER_OWNER_PATH_SEGMENT = "owner";

export function workspaceMemberRolesEndpoint(memberId: string): string {
  return `${WorkspaceApiEndpoint.Members}/${encodeURIComponent(memberId)}/${MEMBER_ROLES_PATH_SEGMENT}`;
}

export function workspaceMemberOwnerEndpoint(memberId: string): string {
  return `${WorkspaceApiEndpoint.Members}/${encodeURIComponent(memberId)}/${MEMBER_OWNER_PATH_SEGMENT}`;
}

export function workspaceRoleEndpoint(roleId: string): string {
  return `${WorkspaceApiEndpoint.Roles}/${encodeURIComponent(roleId)}`;
}

export function clerkCandidatesEndpoint(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) {
    return WorkspaceApiEndpoint.MembersClerkCandidates;
  }
  const params = new URLSearchParams({ query: trimmed });
  return `${WorkspaceApiEndpoint.MembersClerkCandidates}?${params.toString()}`;
}
