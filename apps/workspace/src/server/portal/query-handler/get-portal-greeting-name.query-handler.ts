import "server-only";

import { eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers, people } from "@invessiv/db/record-configuration";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";

/**
 * First name of the contact behind the membership, for the header greeting. The owner view greets
 * nobody: it is not the customer's own session.
 */
export async function getPortalGreetingName(
  reader: PortalReader,
): Promise<string | null> {
  if (isPortalOwnerView(reader)) return null;

  const rows = await getDrizzleDatabaseClient()
    .select({ firstName: people.first_name })
    .from(customers)
    .innerJoin(people, eq(people.id, reader.personId))
    .where(
      portalAccessCondition.forReader(reader, Permission.PortalAccess, {
        customerId: customers.id,
      }),
    )
    .limit(1);

  return rows[0]?.firstName?.trim() || null;
}
