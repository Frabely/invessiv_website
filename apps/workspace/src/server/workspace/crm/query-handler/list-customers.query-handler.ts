import "server-only";

import type { ListCustomersResult } from "@invessiv/common/contracts/crm/results/list-customers-result";
import type { CustomerListFilters } from "@/common/contracts/crm/customer-list-filters";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { customerService } from "@/server/workspace/crm/services/customer/customer-service";

export async function listCustomers(
  filters: CustomerListFilters,
  actor: WorkspaceActor,
): Promise<ListCustomersResult> {
  return customerService.search(filters, actor);
}
