import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers } from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";

/** The company name for page headings and the owner banner; works for contacts and the owner view alike. */
export async function getPortalCustomerDisplayName(
  reader: PortalReader,
): Promise<string | null> {
  const rows = await getDrizzleDatabaseClient()
    .select({ displayName: customers.display_name })
    .from(customers)
    .where(
      portalAccessCondition.forReader(reader, Permission.PortalAccess, {
        customerId: customers.id,
      }),
    )
    .limit(1);

  return rows[0]?.displayName ?? null;
}
