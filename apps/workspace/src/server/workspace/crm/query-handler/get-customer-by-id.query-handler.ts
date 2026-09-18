import "server-only";

import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { customerService } from "@/server/workspace/crm/services/customer/customer-service";

/** Archived customers stay addressable; an unknown or malformed id is `null`, never a throw. */
export async function getCustomerById(
  customerId: string,
  actor: WorkspaceActor,
  includeSourceLeads = false,
): Promise<CustomerDetailDto | null> {
  return customerService.get(customerId, actor, includeSourceLeads);
}
