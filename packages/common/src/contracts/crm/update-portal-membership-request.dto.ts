export interface UpdatePortalMembershipRequestDto {
  /** Expected membership version for the notification preference update. */
  version: number;
  /** Stored now; digest delivery is activated with the later mail flow. */
  emailNotificationsEnabled: boolean;
}
