import "server-only";

import type { LeadCategoryDto } from "@invessiv/common/contracts/leads/lead-category.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerCategoryService } from "@/server/workspace/crm/services/customer-category-service";

/** Customers share the category vocabulary of leads, so a conversion keeps it. */
export async function listActiveCustomerCategories(): Promise<
  LeadCategoryDto[]
> {
  return customerCategoryService.listActive(getDrizzleDatabaseClient());
}
