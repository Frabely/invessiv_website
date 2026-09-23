/** Constraint and index names of `portal_memberships`, declared once for the model and the migration. */
export const PortalMembershipsConstraintName = {
  CustomerForeignKey: "portal_memberships_customer_id_fkey",
  PersonForeignKey: "portal_memberships_person_id_fkey",
  UserForeignKey: "portal_memberships_user_id_fkey",
  AssignmentForeignKey: "portal_memberships_assignment_fkey",
  VersionCheck: "portal_memberships_version_check",
  CustomerPersonUnique: "portal_memberships_customer_person_uidx",
  ActiveUserIndex: "portal_memberships_active_user_idx",
  ActiveCustomerIndex: "portal_memberships_active_customer_idx",
} as const;

export type PortalMembershipsConstraintName =
  (typeof PortalMembershipsConstraintName)[keyof typeof PortalMembershipsConstraintName];

export const PORTAL_MEMBERSHIPS_CONSTRAINT_NAME_VALUES = [
  PortalMembershipsConstraintName.CustomerForeignKey,
  PortalMembershipsConstraintName.PersonForeignKey,
  PortalMembershipsConstraintName.UserForeignKey,
  PortalMembershipsConstraintName.AssignmentForeignKey,
  PortalMembershipsConstraintName.VersionCheck,
  PortalMembershipsConstraintName.CustomerPersonUnique,
  PortalMembershipsConstraintName.ActiveUserIndex,
  PortalMembershipsConstraintName.ActiveCustomerIndex,
] as const;
