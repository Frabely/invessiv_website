import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import {
  rolePermissions,
  roles,
  workspaceMemberRoles,
} from "@invessiv/db/record-configuration";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";
import { roleMappingService } from "@/server/workspace/access/services/role-mapping-service";

async function load(
  executor: AccessDatabaseExecutor,
  roleId?: string,
): Promise<RoleDto[]> {
  const [rows, countRows] = await Promise.all([
    executor
      .select({
        id: roles.id,
        name: roles.name,
        system_key: roles.system_key,
        description: roles.description,
        is_system: roles.is_system,
        active: roles.active,
        version: roles.version,
        created_at: roles.created_at,
        updated_at: roles.updated_at,
        permission_key: rolePermissions.permission_key,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(rolePermissions.role_id, roles.id))
      .where(
        and(
          eq(roles.realm, AuthRealm.Workspace),
          roleId ? eq(roles.id, roleId) : undefined,
        ),
      ),
    executor
      .select({
        role_id: workspaceMemberRoles.role_id,
        assigned_member_count: sql<number>`count(*)::int`,
      })
      .from(workspaceMemberRoles)
      .where(roleId ? eq(workspaceMemberRoles.role_id, roleId) : undefined)
      .groupBy(workspaceMemberRoles.role_id),
  ]);

  return roleMappingService.mapRowsToRoles(rows, countRows);
}

async function list(executor: AccessDatabaseExecutor): Promise<RoleDto[]> {
  return load(executor);
}

async function findById(
  executor: AccessDatabaseExecutor,
  roleId: string,
): Promise<RoleDto | null> {
  const [role] = await load(executor, roleId);
  return role ?? null;
}

export const roleReadService = {
  findById,
  list,
} as const;
