import "server-only";

import type { ListCustomersResult } from "@invessiv/common/contracts/crm/results/list-customers-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerReadService } from "@/server/workspace/crm/services/customer-read-service";

// Fixed until Task 03 adds pagination; the overview deliberately has no paging controls yet.
const CUSTOMER_OVERVIEW_LIMIT = 100;

export async function listCustomers(): Promise<ListCustomersResult> {
  const rows = await customerReadService.listSummaries(
    getDrizzleDatabaseClient(),
    CUSTOMER_OVERVIEW_LIMIT,
  );

  return { rows };
}
