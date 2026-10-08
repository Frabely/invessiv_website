export const SystemRoleKey = {
  WorkspaceOwner: "workspace_owner",
  WorkspaceMember: "workspace_member",
  WorkspaceCredentialsManager: "workspace_credentials_manager",
  PortalStandard: "portal_standard",
  PortalCredentials: "portal_credentials",
} as const;

export type SystemRoleKey = (typeof SystemRoleKey)[keyof typeof SystemRoleKey];

export const SYSTEM_ROLE_KEY_VALUES = [
  SystemRoleKey.WorkspaceOwner,
  SystemRoleKey.WorkspaceMember,
  SystemRoleKey.WorkspaceCredentialsManager,
  SystemRoleKey.PortalStandard,
  SystemRoleKey.PortalCredentials,
] as const;
