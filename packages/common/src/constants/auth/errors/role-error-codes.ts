/**
 * Version conflicts are not listed here: every versioned write answers them with
 * `ConcurrencyErrorCode.VersionConflict` and the current state.
 */
export const RoleErrorCode = {
  RoleNotFound: "ROLE_NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  RoleNameTaken: "ROLE_NAME_TAKEN",
  PermissionNotDelegable: "PERMISSION_NOT_DELEGABLE",
  SystemRoleImmutable: "SYSTEM_ROLE_IMMUTABLE",
  Internal: "INTERNAL",
} as const;

export type RoleErrorCode = (typeof RoleErrorCode)[keyof typeof RoleErrorCode];

export const ROLE_ERROR_CODE_VALUES = [
  RoleErrorCode.RoleNotFound,
  RoleErrorCode.ValidationError,
  RoleErrorCode.RoleNameTaken,
  RoleErrorCode.PermissionNotDelegable,
  RoleErrorCode.SystemRoleImmutable,
  RoleErrorCode.Internal,
] as const;
