/** Input for an internal, customer-bound portal invitation. */
export interface InvitePortalContactRequestDto {
  /** Existing customer-contact assignment; never a free-form email address. */
  assignmentId: string;
  /** Active portal-realm roles to transfer when the invitation is redeemed. */
  roleIds: string[];
  /** Persisted for future digests; no email is sent until the outbox flow exists. */
  emailNotificationsEnabled: boolean;
}
