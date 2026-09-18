import "server-only";

import type { UpdateCustomerRequestDto } from "@invessiv/common/contracts/crm/update-customer-request.dto";
import type { UpdateCustomerResult } from "@invessiv/common/contracts/crm/results/update-customer-result";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { customerService } from "@/server/workspace/crm/services/customer/customer-service";

export async function updateCustomer(
  customerId: string,
  input: UpdateCustomerRequestDto,
  actor: WorkspaceActor,
): Promise<UpdateCustomerResult> {
  return customerService.update(customerId, input, actor);
}
