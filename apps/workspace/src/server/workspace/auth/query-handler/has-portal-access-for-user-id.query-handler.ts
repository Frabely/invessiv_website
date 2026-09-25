import "server-only";

import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { portalMembershipLookupService } from "@/server/portal/services/portal-membership-lookup-service";
import { portalAccessHintService } from "@/server/workspace/auth/services/portal-access-hint-service";

/**
 * Whether a resolved `WorkspaceActor` also holds an active portal membership, for the internal
 * header's portal hint. Calls the portal realm's read-only lookup service directly rather than its
 * query-handler, since no handler may serve both the workspace and the portal realm.
 */
export async function hasPortalAccessForUserId(
  userId: string,
): Promise<boolean> {
  return portalAccessHintService.resolve(() =>
    portalMembershipLookupService.listActiveCustomersForUserId(
      getDrizzleDatabaseClient(),
      userId,
    ),
  );
}
