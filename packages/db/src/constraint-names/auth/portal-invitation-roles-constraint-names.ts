/** Constraint and index names of `portal_invitation_roles`, declared once for the model and the migration. */
export const PortalInvitationRolesConstraintName = {
  PrimaryKey: "portal_invitation_roles_pkey",
  InvitationForeignKey: "portal_invitation_roles_portal_invitation_id_fkey",
  RoleForeignKey: "portal_invitation_roles_role_fkey",
  RoleRealmCheck: "portal_invitation_roles_role_realm_check",
} as const;

export type PortalInvitationRolesConstraintName =
  (typeof PortalInvitationRolesConstraintName)[keyof typeof PortalInvitationRolesConstraintName];

export const PORTAL_INVITATION_ROLES_CONSTRAINT_NAME_VALUES = [
  PortalInvitationRolesConstraintName.PrimaryKey,
  PortalInvitationRolesConstraintName.InvitationForeignKey,
  PortalInvitationRolesConstraintName.RoleForeignKey,
  PortalInvitationRolesConstraintName.RoleRealmCheck,
] as const;
