/** Constraint and index names of `roles`, declared once for the model, error mapping and smokes. */
export const RolesConstraintName = {
  RealmCheck: "roles_realm_check",
  SystemKeyCheck: "roles_system_key_check",
  SystemKeyConsistencyCheck: "roles_system_key_consistency_check",
  NameCheck: "roles_name_check",
  VersionCheck: "roles_version_check",
  SystemKeyUnique: "roles_system_key_uidx",
  RealmNameUnique: "roles_realm_name_uidx",
  IdRealmUnique: "roles_id_realm_uidx",
  IdRealmIsSystemUnique: "roles_id_realm_is_system_uidx",
  IdRealmScopeAssignableUnique: "roles_id_realm_scope_assignable_unique",
  SystemScopeAssignableCheck: "roles_system_scope_assignable_check",
} as const;

export type RolesConstraintName =
  (typeof RolesConstraintName)[keyof typeof RolesConstraintName];

export const ROLES_CONSTRAINT_NAME_VALUES = [
  RolesConstraintName.RealmCheck,
  RolesConstraintName.SystemKeyCheck,
  RolesConstraintName.SystemKeyConsistencyCheck,
  RolesConstraintName.NameCheck,
  RolesConstraintName.VersionCheck,
  RolesConstraintName.SystemKeyUnique,
  RolesConstraintName.RealmNameUnique,
  RolesConstraintName.IdRealmUnique,
  RolesConstraintName.IdRealmIsSystemUnique,
  RolesConstraintName.IdRealmScopeAssignableUnique,
  RolesConstraintName.SystemScopeAssignableCheck,
] as const;
