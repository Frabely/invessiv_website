import "server-only";

import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { portalMembershipLookupService } from "@/server/portal/services/portal-membership-lookup-service";

/**
 * Whether a signed-in Clerk identity with no workspace membership holds an active portal
 * membership, for the post-login switch on `[locale]/page.tsx`. Calls the portal realm's read-only
 * lookup service directly rather than its query-handler, since no handler may serve both the
 * workspace and the portal realm. Fails closed on a DB error by keeping the visitor on the existing
 * pending screen instead of failing the render.
 */
export async function hasPortalAccessForClerkUser(
  clerkUserId: string,
): Promise<boolean> {
  try {
    const memberships =
      await portalMembershipLookupService.listActiveCustomersForUser(
        getDrizzleDatabaseClient(),
        clerkUserId,
      );
    return memberships.length > 0;
  } catch (error: unknown) {
    console.error("[workspace-auth] portal access hint lookup failed", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return false;
  }
}
