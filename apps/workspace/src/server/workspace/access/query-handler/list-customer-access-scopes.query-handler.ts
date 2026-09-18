import "server-only";

import type { WorkspaceMemberAccessScopeDto } from "@invessiv/common/contracts/auth/workspace-member-access-scope.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { accessScopeReadService } from "@/server/workspace/access/services/access-scope-read-service";

export async function listCustomerAccessScopes(
  customerId: string,
): Promise<WorkspaceMemberAccessScopeDto[]> {
  const db = getDrizzleDatabaseClient();
  return accessScopeReadService.listByCustomer(db, customerId);
}
