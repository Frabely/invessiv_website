export interface PortalInvitationDto {
  /** Invitation ID used for revocation, never the plaintext token. */
  id: string;
  /** Links the invitation to a contact in `contacts`. */
  assignmentId: string;
  /** Portal roles fixed at invitation creation time. */
  roleIds: string[];
  /** Expiry instant; an expired row may still be displayed for re-inviting. */
  expiresAt: string;
  /** Server-side expiry state at the time the customer record was loaded. */
  expired: boolean;
  /** Creation instant for audit-oriented ordering. */
  createdAt: string;
}
