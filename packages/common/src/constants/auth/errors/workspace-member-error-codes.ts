/**
 * Version conflicts are not listed here: every versioned write answers them with
 * `ConcurrencyErrorCode.VersionConflict` and the current state.
 */
export const WorkspaceMemberErrorCode = {
  MemberNotFound: "MEMBER_NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  ClerkAccountNotFound: "CLERK_ACCOUNT_NOT_FOUND",
  ClerkAccountIncomplete: "CLERK_ACCOUNT_INCOMPLETE",
  ClerkAccountAlreadyLinked: "CLERK_ACCOUNT_ALREADY_LINKED",
  ClerkUnavailable: "CLERK_UNAVAILABLE",
  RoleNotAssignable: "ROLE_NOT_ASSIGNABLE",
  OwnerRoleNotAssignable: "OWNER_ROLE_NOT_ASSIGNABLE",
  MemberWithoutRole: "MEMBER_WITHOUT_ROLE",
  AlreadyOwner: "ALREADY_OWNER",
  NotOwner: "NOT_OWNER",
  LastActiveOwner: "LAST_ACTIVE_OWNER",
  SelfOwnerRevocation: "SELF_OWNER_REVOCATION",
  Internal: "INTERNAL",
} as const;

export type WorkspaceMemberErrorCode =
  (typeof WorkspaceMemberErrorCode)[keyof typeof WorkspaceMemberErrorCode];

export const WORKSPACE_MEMBER_ERROR_CODE_VALUES = [
  WorkspaceMemberErrorCode.MemberNotFound,
  WorkspaceMemberErrorCode.ValidationError,
  WorkspaceMemberErrorCode.ClerkAccountNotFound,
  WorkspaceMemberErrorCode.ClerkAccountIncomplete,
  WorkspaceMemberErrorCode.ClerkAccountAlreadyLinked,
  WorkspaceMemberErrorCode.ClerkUnavailable,
  WorkspaceMemberErrorCode.RoleNotAssignable,
  WorkspaceMemberErrorCode.OwnerRoleNotAssignable,
  WorkspaceMemberErrorCode.MemberWithoutRole,
  WorkspaceMemberErrorCode.AlreadyOwner,
  WorkspaceMemberErrorCode.NotOwner,
  WorkspaceMemberErrorCode.LastActiveOwner,
  WorkspaceMemberErrorCode.SelfOwnerRevocation,
  WorkspaceMemberErrorCode.Internal,
] as const;
