export const SecurityEventType = {
  WorkspaceOwnerBootstrapped: "workspace_owner_bootstrapped",
  WorkspaceMemberAdded: "workspace_member_added",
  WorkspaceMemberRolesChanged: "workspace_member_roles_changed",
  WorkspaceOwnerGranted: "workspace_owner_granted",
  WorkspaceOwnerRevoked: "workspace_owner_revoked",
  WorkspaceMemberDeactivated: "workspace_member_deactivated",
  WorkspaceMemberActivated: "workspace_member_activated",
  WorkspaceResponsibilitiesHandedOver: "workspace_responsibilities_handed_over",
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
  SecurityEventType.WorkspaceMemberDeactivated,
  SecurityEventType.WorkspaceMemberActivated,
  SecurityEventType.WorkspaceResponsibilitiesHandedOver,
  SecurityEventType.RoleCreated,
  SecurityEventType.RoleUpdated,
] as const;
