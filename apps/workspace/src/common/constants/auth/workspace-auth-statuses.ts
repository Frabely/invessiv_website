export const WorkspaceAuthStatus = {
  Authorized: "authorized",
  Unauthenticated: "unauthenticated",
  NotMember: "not_member",
  Inactive: "inactive",
  Unavailable: "unavailable",
} as const;

export type WorkspaceAuthStatus =
  (typeof WorkspaceAuthStatus)[keyof typeof WorkspaceAuthStatus];

export const WORKSPACE_AUTH_STATUS_VALUES = [
  WorkspaceAuthStatus.Authorized,
  WorkspaceAuthStatus.Unauthenticated,
  WorkspaceAuthStatus.NotMember,
  WorkspaceAuthStatus.Inactive,
  WorkspaceAuthStatus.Unavailable,
] as const;
