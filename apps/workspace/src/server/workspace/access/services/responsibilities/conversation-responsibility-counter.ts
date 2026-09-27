import "server-only";

import { and, count, eq, inArray } from "drizzle-orm";

import { CUSTOMER_ACTIVE_STATUS_VALUES } from "@invessiv/common/constants/crm/customer-statuses";
import { conversations, customers } from "@invessiv/db/record-configuration";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";

/** Like customers, conversations of archived customers no longer block a deactivation. */
async function countOpen(
  executor: AccessDatabaseExecutor,
  memberId: string,
): Promise<number> {
  const [row] = await executor
    .select({ count: count() })
    .from(conversations)
    .innerJoin(customers, eq(customers.id, conversations.customer_id))
    .where(
      and(
        eq(conversations.owner_member_id, memberId),
        inArray(customers.status, CUSTOMER_ACTIVE_STATUS_VALUES),
      ),
    );

  return row?.count ?? 0;
}

export const conversationResponsibilityCounterService = {
  countOpen,
} as const;
