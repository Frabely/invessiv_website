/** Constraint and index names of `permissions`, declared once for the model and smokes. */
export const PermissionsConstraintName = {
  RealmCheck: "permissions_realm_check",
  DescriptionCheck: "permissions_description_check",
  KeyRealmDelegableUnique: "permissions_key_realm_delegable_uidx",
  KeyRealmScopeAssignableUnique:
    "permissions_key_realm_scope_assignable_unique",
} as const;

export type PermissionsConstraintName =
  (typeof PermissionsConstraintName)[keyof typeof PermissionsConstraintName];

export const PERMISSIONS_CONSTRAINT_NAME_VALUES = [
  PermissionsConstraintName.RealmCheck,
  PermissionsConstraintName.DescriptionCheck,
  PermissionsConstraintName.KeyRealmDelegableUnique,
  PermissionsConstraintName.KeyRealmScopeAssignableUnique,
] as const;
