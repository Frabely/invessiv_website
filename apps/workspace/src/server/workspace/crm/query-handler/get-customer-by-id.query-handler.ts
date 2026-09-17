import "server-only";

import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import { customerService } from "@/server/workspace/crm/services/customer/customer-service";

/** Archived customers stay addressable; an unknown or malformed id is `null`, never a throw. */
export async function getCustomerById(
  customerId: string,
  includeSourceLeads = false,
): Promise<CustomerDetailDto | null> {
  return customerService.get(customerId, includeSourceLeads);
}
