import "server-only";

import type { ListCustomersResult } from "@invessiv/common/contracts/crm/results/list-customers-result";
import type { CustomerListFilters } from "@/common/contracts/crm/customer-list-filters";
import { customerService } from "@/server/workspace/crm/services/customer/customer-service";

export async function listCustomers(
  filters: CustomerListFilters,
): Promise<ListCustomersResult> {
  return customerService.search(filters);
}
