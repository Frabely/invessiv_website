import "server-only";

import type { ListCustomersResult } from "@invessiv/common/contracts/crm/results/list-customers-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { CustomerListFilters } from "@/common/contracts/crm/customer-list-filters";
import { customerReadService } from "@/server/workspace/crm/services/customer-read-service";

const CUSTOMER_LIST_PAGE_SIZE = 25;

export async function listCustomers(
  filters: CustomerListFilters,
): Promise<ListCustomersResult> {
  const db = getDrizzleDatabaseClient();
  const total = await customerReadService.countSummaries(
    db,
    filters.includeArchived,
  );
  const hasCustomers =
    total > 0 ||
    (!filters.includeArchived &&
      (await customerReadService.countSummaries(db, true)) > 0);
  const totalPages = Math.max(1, Math.ceil(total / CUSTOMER_LIST_PAGE_SIZE));
  const page = total > 0 ? Math.min(filters.page, totalPages) : 1;
  const rows = await customerReadService.listSummaries(
    db,
    { ...filters, page },
    CUSTOMER_LIST_PAGE_SIZE,
  );

  return {
    hasCustomers,
    page,
    perPage: CUSTOMER_LIST_PAGE_SIZE,
    rows,
    total,
  };
}
