/**
 * Constraint and index names the workspace maps to domain errors. The models declare them from
 * here, so a rename changes model and error mapping together; `db:smoke:rbac` checks that each
 * name exists in the database.
 */
export const AuthConstraintName = {
  UsersClerkUserIdUnique: "users_clerk_user_id_uidx",
  UsersPrimaryEmailCheck: "users_primary_email_check",
  UsersDisplayNameCheck: "users_display_name_check",
  RolesRealmNameUnique: "roles_realm_name_uidx",
  WorkspaceMemberRolesRoleForeignKey: "workspace_member_roles_role_fkey",
} as const;

export type AuthConstraintName =
  (typeof AuthConstraintName)[keyof typeof AuthConstraintName];

export const AUTH_CONSTRAINT_NAME_VALUES = [
  AuthConstraintName.UsersClerkUserIdUnique,
  AuthConstraintName.UsersPrimaryEmailCheck,
  AuthConstraintName.UsersDisplayNameCheck,
  AuthConstraintName.RolesRealmNameUnique,
  AuthConstraintName.WorkspaceMemberRolesRoleForeignKey,
] as const;
