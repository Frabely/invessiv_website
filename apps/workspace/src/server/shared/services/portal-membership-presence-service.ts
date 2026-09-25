import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { portalMemberships } from "@invessiv/db/record-configuration";

async function hasActiveMembership(
  tx: ContactDatabaseTransaction,
  customerId: string,
  personId: string,
): Promise<boolean> {
  const [membership] = await tx
    .select({ id: portalMemberships.id })
    .from(portalMemberships)
    .where(
      and(
        eq(portalMemberships.customer_id, customerId),
        eq(portalMemberships.person_id, personId),
        isNull(portalMemberships.revoked_at),
      ),
    )
    .limit(1);
  return membership !== undefined;
}

export const portalMembershipPresenceService = { hasActiveMembership } as const;
