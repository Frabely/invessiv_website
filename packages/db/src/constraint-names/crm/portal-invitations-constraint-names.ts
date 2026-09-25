/** Constraint and index names of `portal_invitations`, declared once for the model and the migration. */
export const PortalInvitationsConstraintName = {
  AssignmentForeignKey: "portal_invitations_assignment_id_fkey",
  CreatedByForeignKey: "portal_invitations_created_by_member_id_fkey",
  TokenHashUnique: "portal_invitations_token_hash_uidx",
  OpenUnique: "portal_invitations_open_uidx",
  ExpiresIndex: "portal_invitations_expires_at_idx",
  RedemptionStateCheck: "portal_invitations_redemption_state_check",
} as const;

export type PortalInvitationsConstraintName =
  (typeof PortalInvitationsConstraintName)[keyof typeof PortalInvitationsConstraintName];

export const PORTAL_INVITATIONS_CONSTRAINT_NAME_VALUES = [
  PortalInvitationsConstraintName.AssignmentForeignKey,
  PortalInvitationsConstraintName.CreatedByForeignKey,
  PortalInvitationsConstraintName.TokenHashUnique,
  PortalInvitationsConstraintName.OpenUnique,
  PortalInvitationsConstraintName.ExpiresIndex,
  PortalInvitationsConstraintName.RedemptionStateCheck,
] as const;
