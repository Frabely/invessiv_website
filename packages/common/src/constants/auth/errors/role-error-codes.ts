/**
 * Version conflicts are not listed here: every versioned write answers them with
 * `ConcurrencyErrorCode.VersionConflict` and the current state.
 */
export const RoleErrorCode = {
  RoleNotFound: "ROLE_NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  RoleNameTaken: "ROLE_NAME_TAKEN",
  RoleNameReserved: "ROLE_NAME_RESERVED",
  PermissionNotDelegable: "PERMISSION_NOT_DELEGABLE",
  PermissionNotScopeAssignable: "ROLE_PERMISSION_NOT_SCOPE_ASSIGNABLE",
  ScopeAssignmentsExist: "ROLE_SCOPE_ASSIGNMENTS_EXIST",
  WorkspaceAssignmentsExist: "ROLE_WORKSPACE_ASSIGNMENTS_EXIST",
  SystemRoleImmutable: "SYSTEM_ROLE_IMMUTABLE",
  Internal: "INTERNAL",
} as const;

export type RoleErrorCode = (typeof RoleErrorCode)[keyof typeof RoleErrorCode];

export const ROLE_ERROR_CODE_VALUES = [
  RoleErrorCode.RoleNotFound,
  RoleErrorCode.ValidationError,
  RoleErrorCode.RoleNameTaken,
  RoleErrorCode.RoleNameReserved,
  RoleErrorCode.PermissionNotDelegable,
  RoleErrorCode.PermissionNotScopeAssignable,
  RoleErrorCode.ScopeAssignmentsExist,
  RoleErrorCode.WorkspaceAssignmentsExist,
  RoleErrorCode.SystemRoleImmutable,
  RoleErrorCode.Internal,
] as const;
