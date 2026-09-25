import "server-only";

import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { roleService } from "@/server/workspace/access/services/role-service";

/** Returns only the role fields needed by the members tab. */
export async function listRoleAssignmentOptions(): Promise<
  RoleAssignmentOptionDto[]
> {
  const roles = await roleService.list(
    getDrizzleDatabaseClient(),
    AuthRealm.Workspace,
  );
  return roles.map(
    ({
      id,
      name,
      systemKey,
      active,
      description,
      scopeAssignable,
      permissions,
    }) => ({
      id,
      name,
      systemKey,
      active,
      description,
      scopeAssignable: scopeAssignable,
      permissions,
    }),
  );
}
