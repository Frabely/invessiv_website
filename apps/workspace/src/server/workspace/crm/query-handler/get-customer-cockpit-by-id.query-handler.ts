import "server-only";

import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";
import { customerCockpitReadService } from "@/server/workspace/crm/services/customer-cockpit-read-service";

/** Unknown or malformed ids deliberately behave like a missing customer. */
export async function getCustomerCockpitById(
  customerId: string,
): Promise<CustomerCockpitDto | null> {
  if (!customerSchemas.entityId.safeParse(customerId).success) return null;

  return customerCockpitReadService.findById(
    getDrizzleDatabaseClient(),
    customerId,
  );
}
