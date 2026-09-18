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
  AccessScopeAlreadyGranted: "ACCESS_SCOPE_ALREADY_GRANTED",
  AccessScopeNotAssignable: "ACCESS_SCOPE_NOT_ASSIGNABLE",
  AccessScopeProjectCustomerMismatch: "ACCESS_SCOPE_PROJECT_CUSTOMER_MISMATCH",
  AccessScopeNotFound: "ACCESS_SCOPE_NOT_FOUND",
  AlreadyOwner: "ALREADY_OWNER",
  NotOwner: "NOT_OWNER",
  LastActiveOwner: "LAST_ACTIVE_OWNER",
  SelfOwnerRevocation: "SELF_OWNER_REVOCATION",
  MemberAlreadyActive: "MEMBER_ALREADY_ACTIVE",
  MemberAlreadyInactive: "MEMBER_ALREADY_INACTIVE",
  SelfDeactivation: "SELF_DEACTIVATION",
  MemberHasOpenResponsibilities: "MEMBER_HAS_OPEN_RESPONSIBILITIES",
  MemberInactive: "MEMBER_INACTIVE",
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
  WorkspaceMemberErrorCode.AccessScopeAlreadyGranted,
  WorkspaceMemberErrorCode.AccessScopeNotAssignable,
  WorkspaceMemberErrorCode.AccessScopeProjectCustomerMismatch,
  WorkspaceMemberErrorCode.AccessScopeNotFound,
  WorkspaceMemberErrorCode.AlreadyOwner,
  WorkspaceMemberErrorCode.NotOwner,
  WorkspaceMemberErrorCode.LastActiveOwner,
  WorkspaceMemberErrorCode.SelfOwnerRevocation,
  WorkspaceMemberErrorCode.MemberAlreadyActive,
  WorkspaceMemberErrorCode.MemberAlreadyInactive,
  WorkspaceMemberErrorCode.SelfDeactivation,
  WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
  WorkspaceMemberErrorCode.MemberInactive,
  WorkspaceMemberErrorCode.Internal,
] as const;
