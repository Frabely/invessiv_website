/** Constraint and index names of `role_permissions`, declared once for the model and smokes. */
export const RolePermissionsConstraintName = {
  PrimaryKey: "role_permissions_pkey",
  RoleForeignKey: "role_permissions_role_fkey",
  PermissionForeignKey: "role_permissions_permission_fkey",
  RealmCheck: "role_permissions_realm_check",
  DelegationCheck: "role_permissions_delegation_check",
  PermissionKeyIndex: "role_permissions_permission_key_idx",
} as const;

export type RolePermissionsConstraintName =
  (typeof RolePermissionsConstraintName)[keyof typeof RolePermissionsConstraintName];

export const ROLE_PERMISSIONS_CONSTRAINT_NAME_VALUES = [
  RolePermissionsConstraintName.PrimaryKey,
  RolePermissionsConstraintName.RoleForeignKey,
  RolePermissionsConstraintName.PermissionForeignKey,
  RolePermissionsConstraintName.RealmCheck,
  RolePermissionsConstraintName.DelegationCheck,
  RolePermissionsConstraintName.PermissionKeyIndex,
] as const;
