import "server-only";

import { and, count, eq, inArray } from "drizzle-orm";

import { CUSTOMER_ACTIVE_STATUS_VALUES } from "@invessiv/common/constants/crm/customer-statuses";
import { customers } from "@invessiv/db/record-configuration";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";

export async function countOpenCustomerResponsibilities(
  executor: AccessDatabaseExecutor,
  memberId: string,
): Promise<number> {
  const [row] = await executor
    .select({ count: count() })
    .from(customers)
    .where(
      and(
        eq(customers.owner_member_id, memberId),
        inArray(customers.status, CUSTOMER_ACTIVE_STATUS_VALUES),
      ),
    );

  return row?.count ?? 0;
}
