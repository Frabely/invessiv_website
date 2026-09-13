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
