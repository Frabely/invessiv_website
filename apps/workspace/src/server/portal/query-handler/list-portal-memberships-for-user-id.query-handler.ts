import "server-only";

import { cache } from "react";
import type { PortalMembershipOptionDto } from "@invessiv/common/contracts/portal/portal-membership-option.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { portalMembershipLookupService } from "@/server/portal/services/portal-membership-lookup-service";

async function listMemberships(
  userId: string,
): Promise<PortalMembershipOptionDto[]> {
  return portalMembershipLookupService.listActiveCustomersForUserId(
    getDrizzleDatabaseClient(),
    userId,
  );
}

/**
 * The companies an already-resolved portal user belongs to, for the customer switcher. Takes
 * `users.id`, never a Clerk id, so callers that already hold a `PortalActor` never re-authenticate
 * against Clerk for this. `cache()` deduplicates the layout's and the page's calls within the same
 * render.
 */
export const listPortalMembershipsForUserId = cache(listMemberships);
