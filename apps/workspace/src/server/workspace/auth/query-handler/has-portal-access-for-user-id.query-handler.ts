import "server-only";

import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { portalMembershipLookupService } from "@/server/portal/services/portal-membership-lookup-service";

/**
 * Whether a resolved `WorkspaceActor` also holds an active portal membership, for the internal
 * header's portal hint. Calls the portal realm's read-only lookup service directly rather than its
 * query-handler, since no handler may serve both the workspace and the portal realm. Fails closed
 * on a DB error by hiding the hint instead of failing the workspace render.
 */
export async function hasPortalAccessForUserId(
  userId: string,
): Promise<boolean> {
  try {
    const memberships =
      await portalMembershipLookupService.listActiveCustomersForUserId(
        getDrizzleDatabaseClient(),
        userId,
      );
    return memberships.length > 0;
  } catch (error: unknown) {
    console.error("[workspace-auth] portal access hint lookup failed", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return false;
  }
}
