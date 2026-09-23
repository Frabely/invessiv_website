import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";

import type { PortalMembershipOptionDto } from "@invessiv/common/contracts/portal/portal-membership-option.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customers,
  portalMemberships,
  users,
} from "@invessiv/db/record-configuration";
import { portalMembershipOptionMappingService } from "@/server/portal/services/portal-membership-option-mapping-service";

/** Reads run on the pooled client; no writer is needed for a company picker lookup. */
type PortalDatabaseExecutor = Pick<ContactDatabaseTransaction, "select">;

/**
 * The customer id narrows the join itself: a revoked or inactive membership never appears in the
 * rows, so there is nothing to filter out afterwards.
 */
async function listActiveCustomersForUser(
  executor: PortalDatabaseExecutor,
  clerkUserId: string,
): Promise<PortalMembershipOptionDto[]> {
  const rows = await executor
    .select({
      customer_id: portalMemberships.customer_id,
      display_name: customers.display_name,
    })
    .from(portalMemberships)
    .innerJoin(users, eq(users.id, portalMemberships.user_id))
    .innerJoin(customers, eq(customers.id, portalMemberships.customer_id))
    .where(
      and(
        eq(users.clerk_user_id, clerkUserId),
        eq(users.active, true),
        isNull(portalMemberships.revoked_at),
      ),
    )
    .orderBy(asc(customers.display_name), asc(customers.id));

  return rows.map(portalMembershipOptionMappingService.mapMembershipRow);
}

export const portalMembershipLookupService = {
  listActiveCustomersForUser,
} as const;
