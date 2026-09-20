import "server-only";

import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { accessLookupReadService } from "@/server/workspace/access/services/access-lookup-read-service";

/** Takes no actor on purpose: the lookup is the same for every caller who may manage access. */
export async function listAccessCustomers(
  search: string,
): Promise<AccessCustomerOptionDto[]> {
  return accessLookupReadService.searchCustomers(
    getDrizzleDatabaseClient(),
    search,
  );
}
