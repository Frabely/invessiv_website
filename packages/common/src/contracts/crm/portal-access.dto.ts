export interface PortalAccessDto {
  /** Customer whose access records passed the caller's portal.manage scope. */
  customerId: string;
  /** Required when confirming the customer's first portal preview. */
  customerVersion: number;
  /** Null until an internal member confirms the first-invitation preview. */
  previewConfirmedAt: string | null;
  /** Existing assignments that can be selected in the invitation dialog. */
  contacts: {
    /** Assignment ID, not the global person ID. */
    assignmentId: string;
    /** Contact label shown only inside the authorized CRM view. */
    displayName: string;
  }[];
  /** Portal-realm roles, including inactive roles needed to display history. */
  roles: {
    /** Role ID used in invitation and membership writes. */
    id: string;
    /** Custom role name, or the persisted name of a system role. */
    name: string;
    /** Nullable for custom roles; identifies the localized standard role. */
    systemKey: string | null;
    /** Inactive roles remain visible but cannot be newly assigned. */
    active: boolean;
    /** Effective permission keys used by the preview's area list. */
    permissions: string[];
  }[];
  /** Unredeemed and unrevoked invitations for this customer. */
  invitations: {
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
  }[];
  /** Active memberships only; revoked rows remain in database history. */
  memberships: {
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
  }[];
}
