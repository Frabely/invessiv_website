import "server-only";

import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { accessLookupReadService } from "@/server/workspace/access/services/access-lookup-read-service";

/** Takes no actor on purpose, for the same reason as `listAccessCustomers`. */
export async function listAccessCustomerProjects(
  customerId: string,
): Promise<AccessProjectOptionDto[]> {
  return accessLookupReadService.listProjectsOfCustomer(
    getDrizzleDatabaseClient(),
    customerId,
  );
}
