import "server-only";

import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { roleService } from "@/server/workspace/access/services/role-service";

export async function listRoles(): Promise<RoleDto[]> {
  return roleService.list(getDrizzleDatabaseClient());
}
