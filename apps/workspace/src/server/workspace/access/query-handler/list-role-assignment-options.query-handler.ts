import "server-only";

import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { roleReadService } from "@/server/workspace/access/services/role-read-service";

/** Returns only the role fields needed by the members tab. */
export async function listRoleAssignmentOptions(): Promise<
  RoleAssignmentOptionDto[]
> {
  const roles = await roleReadService.list(getDrizzleDatabaseClient());
  return roles.map(
    ({ id, name, systemKey, active, description, permissions }) => ({
      id,
      name,
      systemKey,
      active,
      description,
      permissions,
    }),
  );
}
