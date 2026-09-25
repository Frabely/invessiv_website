/**
 * One row of the left-joined portal actor resolution: user, at most one membership for the
 * requested customer, and at most one granted permission. `null` membership/permission fields
 * mean the join found no match at that level, not that the value is genuinely absent.
 */
export type PortalActorRow = {
  user_id: string;
  user_active: boolean;
  membership_id: string | null;
  person_id: string | null;
  revoked_at: Date | null;
  permission_key: string | null;
};
