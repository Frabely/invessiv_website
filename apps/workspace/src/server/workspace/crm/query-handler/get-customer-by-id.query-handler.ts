import "server-only";

import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerReadService } from "@/server/workspace/crm/services/customer-read-service";
import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";

/** Archived customers stay addressable; an unknown or malformed id is `null`, never a throw. */
export async function getCustomerById(
  customerId: string,
): Promise<CustomerDetailDto | null> {
  if (!customerSchemas.entityId.safeParse(customerId).success) {
    return null;
  }

  return customerReadService.findDetailById(
    getDrizzleDatabaseClient(),
    customerId,
  );
}
