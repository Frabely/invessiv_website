import "server-only";

import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { portalMembershipLookupService } from "@/server/portal/services/portal-membership-lookup-service";
import { portalAccessHintService } from "@/server/workspace/auth/services/portal-access-hint-service";

/**
 * Whether a signed-in Clerk identity with no workspace membership holds an active portal
 * membership, for the post-login switch on `[locale]/page.tsx`. Calls the portal realm's read-only
 * lookup service directly rather than its query-handler, since no handler may serve both the
 * workspace and the portal realm.
 */
export async function hasPortalAccessForClerkUser(
  clerkUserId: string,
): Promise<boolean> {
  return portalAccessHintService.resolve(() =>
    portalMembershipLookupService.listActiveCustomersForUser(
      getDrizzleDatabaseClient(),
      clerkUserId,
    ),
  );
}
