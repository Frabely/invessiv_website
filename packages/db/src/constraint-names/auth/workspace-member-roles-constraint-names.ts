/** Constraint and index names of `workspace_member_roles`, declared once for the model, error mapping and smokes. */
export const WorkspaceMemberRolesConstraintName = {
  PrimaryKey: "workspace_member_roles_pkey",
  RoleForeignKey: "workspace_member_roles_role_fkey",
  RoleRealmCheck: "workspace_member_roles_role_realm_check",
  RoleIdIndex: "workspace_member_roles_role_id_idx",
} as const;

export type WorkspaceMemberRolesConstraintName =
  (typeof WorkspaceMemberRolesConstraintName)[keyof typeof WorkspaceMemberRolesConstraintName];

export const WORKSPACE_MEMBER_ROLES_CONSTRAINT_NAME_VALUES = [
  WorkspaceMemberRolesConstraintName.PrimaryKey,
  WorkspaceMemberRolesConstraintName.RoleForeignKey,
  WorkspaceMemberRolesConstraintName.RoleRealmCheck,
  WorkspaceMemberRolesConstraintName.RoleIdIndex,
] as const;
