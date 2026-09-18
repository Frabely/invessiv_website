export const WorkspaceMemberScopedRolesConstraintName = {
  PrimaryKey: "workspace_member_scoped_roles_pkey",
  RealmCheck: "workspace_member_scoped_roles_realm_check",
  ScopeAssignableCheck: "workspace_member_scoped_roles_scope_assignable_check",
  RoleForeignKey: "workspace_member_scoped_roles_role_foreign_key",
  ProjectCustomerForeignKey:
    "workspace_member_scoped_roles_project_customer_foreign_key",
  CustomerUnique: "workspace_member_scoped_roles_customer_unique",
  ProjectUnique: "workspace_member_scoped_roles_project_unique",
  CustomerIndex: "workspace_member_scoped_roles_customer_index",
  ProjectIndex: "workspace_member_scoped_roles_project_index",
  RoleIndex: "workspace_member_scoped_roles_role_index",
} as const;

export type WorkspaceMemberScopedRolesConstraintName =
  (typeof WorkspaceMemberScopedRolesConstraintName)[keyof typeof WorkspaceMemberScopedRolesConstraintName];

export const WORKSPACE_MEMBER_SCOPED_ROLES_CONSTRAINT_NAME_VALUES =
  Object.values(WorkspaceMemberScopedRolesConstraintName);
