export const WorkspaceAuthStatus = {
  Authorized: "authorized",
  Unauthenticated: "unauthenticated",
  NotMember: "not_member",
  Unavailable: "unavailable",
} as const;

export type WorkspaceAuthStatus =
  (typeof WorkspaceAuthStatus)[keyof typeof WorkspaceAuthStatus];

export const WORKSPACE_AUTH_STATUS_VALUES = [
  WorkspaceAuthStatus.Authorized,
  WorkspaceAuthStatus.Unauthenticated,
  WorkspaceAuthStatus.NotMember,
  WorkspaceAuthStatus.Unavailable,
] as const;

export const WorkspaceActorResolutionError = {
  UserMissing: "user_missing",
  UserInactive: "user_inactive",
  MembershipMissing: "membership_missing",
  MembershipInactive: "membership_inactive",
} as const;

export type WorkspaceActorResolutionError =
  (typeof WorkspaceActorResolutionError)[keyof typeof WorkspaceActorResolutionError];

export const WORKSPACE_ACTOR_RESOLUTION_ERROR_VALUES = [
  WorkspaceActorResolutionError.UserMissing,
  WorkspaceActorResolutionError.UserInactive,
  WorkspaceActorResolutionError.MembershipMissing,
  WorkspaceActorResolutionError.MembershipInactive,
] as const;

export const BootstrapWorkspaceOwnerError = {
  AlreadyInitialized: "already_initialized",
  IdentityMismatch: "identity_mismatch",
} as const;

export type BootstrapWorkspaceOwnerError =
  (typeof BootstrapWorkspaceOwnerError)[keyof typeof BootstrapWorkspaceOwnerError];

export const BOOTSTRAP_WORKSPACE_OWNER_ERROR_VALUES = [
  BootstrapWorkspaceOwnerError.AlreadyInitialized,
  BootstrapWorkspaceOwnerError.IdentityMismatch,
] as const;
