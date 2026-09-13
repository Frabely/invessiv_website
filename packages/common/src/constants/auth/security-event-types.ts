export const SecurityEventType = {
  WorkspaceOwnerBootstrapped: "workspace_owner_bootstrapped",
  WorkspaceMemberAdded: "workspace_member_added",
  WorkspaceMemberRolesChanged: "workspace_member_roles_changed",
  WorkspaceOwnerGranted: "workspace_owner_granted",
  WorkspaceOwnerRevoked: "workspace_owner_revoked",
  RoleCreated: "role_created",
  RoleUpdated: "role_updated",
} as const;

export type SecurityEventType =
  (typeof SecurityEventType)[keyof typeof SecurityEventType];

export const SECURITY_EVENT_TYPE_VALUES = [
  SecurityEventType.WorkspaceOwnerBootstrapped,
  SecurityEventType.WorkspaceMemberAdded,
  SecurityEventType.WorkspaceMemberRolesChanged,
  SecurityEventType.WorkspaceOwnerGranted,
  SecurityEventType.WorkspaceOwnerRevoked,
  SecurityEventType.RoleCreated,
  SecurityEventType.RoleUpdated,
] as const;
