/** Constraint and index names of `users`, declared once for the model, error mapping and smokes. */
export const UsersConstraintName = {
  ClerkUserIdCheck: "users_clerk_user_id_check",
  PrimaryEmailCheck: "users_primary_email_check",
  DisplayNameCheck: "users_display_name_check",
  VersionCheck: "users_version_check",
  ClerkUserIdUnique: "users_clerk_user_id_uidx",
} as const;

export type UsersConstraintName =
  (typeof UsersConstraintName)[keyof typeof UsersConstraintName];

export const USERS_CONSTRAINT_NAME_VALUES = [
  UsersConstraintName.ClerkUserIdCheck,
  UsersConstraintName.PrimaryEmailCheck,
  UsersConstraintName.DisplayNameCheck,
  UsersConstraintName.VersionCheck,
  UsersConstraintName.ClerkUserIdUnique,
] as const;
