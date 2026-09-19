import "server-only";

import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { accessScopeReadService } from "@/server/workspace/access/services/access-scope-read-service";

export async function listCustomerAccessScopes(
  customerId: string,
): Promise<AccessScopeEntryDto[]> {
  const db = getDrizzleDatabaseClient();
  return accessScopeReadService.listByCustomer(db, customerId);
}
