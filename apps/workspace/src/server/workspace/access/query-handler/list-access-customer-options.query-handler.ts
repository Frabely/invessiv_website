import "server-only";

import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { accessLookupReadService } from "@/server/workspace/access/services/access-lookup-read-service";

/** Lists every customer identifier a members manager may assign access to. */
export async function listAccessCustomerOptions(): Promise<
  AccessCustomerOptionDto[]
> {
  return accessLookupReadService.listCustomerOptions(
    getDrizzleDatabaseClient(),
  );
}
