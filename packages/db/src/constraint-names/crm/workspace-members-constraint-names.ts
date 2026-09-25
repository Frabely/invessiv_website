/** Constraint and index names of `workspace_members`, declared once for the model and error mapping. */
export const WorkspaceMembersConstraintName = {
  VersionCheck: "workspace_members_version_check",
  UserIdUnique: "workspace_members_user_id_uidx",
} as const;

export type WorkspaceMembersConstraintName =
  (typeof WorkspaceMembersConstraintName)[keyof typeof WorkspaceMembersConstraintName];

export const WORKSPACE_MEMBERS_CONSTRAINT_NAME_VALUES = [
  WorkspaceMembersConstraintName.VersionCheck,
  WorkspaceMembersConstraintName.UserIdUnique,
] as const;
