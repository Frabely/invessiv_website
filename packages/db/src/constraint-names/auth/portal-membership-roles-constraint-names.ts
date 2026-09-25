/** Constraint and index names of `portal_membership_roles`, declared once for the model and the migration. */
export const PortalMembershipRolesConstraintName = {
  PrimaryKey: "portal_membership_roles_pkey",
  MembershipForeignKey: "portal_membership_roles_portal_membership_id_fkey",
  RoleForeignKey: "portal_membership_roles_role_fkey",
  AssignedByForeignKey: "portal_membership_roles_assigned_by_member_id_fkey",
  RoleRealmCheck: "portal_membership_roles_role_realm_check",
  RoleIdIndex: "portal_membership_roles_role_id_idx",
} as const;

export type PortalMembershipRolesConstraintName =
  (typeof PortalMembershipRolesConstraintName)[keyof typeof PortalMembershipRolesConstraintName];

export const PORTAL_MEMBERSHIP_ROLES_CONSTRAINT_NAME_VALUES = [
  PortalMembershipRolesConstraintName.PrimaryKey,
  PortalMembershipRolesConstraintName.MembershipForeignKey,
  PortalMembershipRolesConstraintName.RoleForeignKey,
  PortalMembershipRolesConstraintName.AssignedByForeignKey,
  PortalMembershipRolesConstraintName.RoleRealmCheck,
  PortalMembershipRolesConstraintName.RoleIdIndex,
] as const;
