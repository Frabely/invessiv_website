export interface PortalMembershipDto {
  /** Membership ID used for role updates and access revocation. */
  id: string;
  /** Links the membership to a contact in `contacts`. */
  assignmentId: string;
  /** Expected version required by subsequent membership writes. */
  version: number;
  /** Current role IDs, independent of the original invitation roles. */
  roleIds: string[];
  /** Instant when the invitation was redeemed. */
  activatedAt: string;
  /** Null until the portal was visited after activation. */
  lastSeenAt: string | null;
  /** Stored for future digests, not a currently visible UI setting. */
  emailNotificationsEnabled: boolean;
}
