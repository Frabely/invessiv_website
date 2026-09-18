import "server-only";

import { and, eq } from "drizzle-orm";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import {
  rolePermissions,
  roles,
  workspaceMemberRoles,
  workspaceMemberScopedRoles,
} from "@invessiv/db/record-configuration";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";
import { roleMappingService } from "@/server/workspace/access/services/role-mapping-service";

async function load(
  executor: AccessDatabaseExecutor,
  roleId?: string,
): Promise<RoleDto[]> {
  const rows = await executor
    .select({
      id: roles.id,
      name: roles.name,
      system_key: roles.system_key,
      description: roles.description,
      is_system: roles.is_system,
      active: roles.active,
      scope_assignable: roles.scope_assignable,
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
    );
  const workspaceAssignmentRows = await executor
    .select({
      role_id: workspaceMemberRoles.role_id,
      workspace_member_id: workspaceMemberRoles.workspace_member_id,
    })
    .from(workspaceMemberRoles)
    .where(roleId ? eq(workspaceMemberRoles.role_id, roleId) : undefined);
  const scopedAssignmentRows = await executor
    .select({
      role_id: workspaceMemberScopedRoles.role_id,
      workspace_member_id: workspaceMemberScopedRoles.workspace_member_id,
    })
    .from(workspaceMemberScopedRoles)
    .where(roleId ? eq(workspaceMemberScopedRoles.role_id, roleId) : undefined);

  const memberIdsByRole = new Map<string, Set<string>>();
  for (const row of [...workspaceAssignmentRows, ...scopedAssignmentRows]) {
    const memberIds = memberIdsByRole.get(row.role_id) ?? new Set<string>();
    memberIds.add(row.workspace_member_id);
    memberIdsByRole.set(row.role_id, memberIds);
  }
  const countRows = [...memberIdsByRole].map(([role_id, memberIds]) => ({
    role_id,
    assigned_member_count: memberIds.size,
  }));

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
