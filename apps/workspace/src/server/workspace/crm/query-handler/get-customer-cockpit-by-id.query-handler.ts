import "server-only";

import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import {
  accessScope,
  customerBaseVisibilityIds,
} from "@/common/patterns/auth/access-scope";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { customerCockpitReadService } from "@/server/workspace/crm/services/customer-cockpit-read-service";

/** Unknown or malformed ids deliberately behave like a missing customer. */
export async function getCustomerCockpitById(
  customerId: string,
  actor: WorkspaceActor,
): Promise<CustomerCockpitDto | null> {
  if (!customerSchemas.entityId.safeParse(customerId).success) return null;

  return customerCockpitReadService.findById(
    getDrizzleDatabaseClient(),
    customerId,
    accessScope(actor, Permission.CustomersRead),
    customerBaseVisibilityIds(actor),
  );
}
