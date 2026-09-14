import "server-only";

import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { roleReadService } from "@/server/workspace/access/services/role-read-service";

export async function listRoles(): Promise<RoleDto[]> {
  return roleReadService.list(getDrizzleDatabaseClient());
}
