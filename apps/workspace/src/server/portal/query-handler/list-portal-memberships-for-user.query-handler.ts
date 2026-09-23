import "server-only";

import type { PortalMembershipOptionDto } from "@invessiv/common/contracts/portal/portal-membership-option.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { portalMembershipLookupService } from "@/server/portal/services/portal-membership-lookup-service";

/**
 * The companies a signed-in portal user may enter, for the company picker at `/portal`. Takes a
 * Clerk id, not a `PortalActor`: no customer is chosen yet, so no actor can exist.
 */
export async function listPortalMembershipsForUser(
  clerkUserId: string,
): Promise<PortalMembershipOptionDto[]> {
  return portalMembershipLookupService.listActiveCustomersForUser(
    getDrizzleDatabaseClient(),
    clerkUserId,
  );
}
