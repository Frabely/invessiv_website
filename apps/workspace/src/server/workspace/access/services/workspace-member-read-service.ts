import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import {
  roles,
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";
import { workspaceMemberMappingService } from "@/server/workspace/access/services/workspace-member-mapping-service";

async function load(
  executor: AccessDatabaseExecutor,
  memberId?: string,
): Promise<WorkspaceMemberDto[]> {
  const rows = await executor
    .select({
      member_id: workspaceMembers.id,
      user_id: users.id,
      display_name: users.display_name,
      primary_email: users.primary_email,
      member_active: workspaceMembers.active,
      member_version: workspaceMembers.version,
      member_created_at: workspaceMembers.created_at,
      role_id: roles.id,
      role_name: roles.name,
      role_system_key: roles.system_key,
      role_active: roles.active,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.user_id))
    .leftJoin(
      workspaceMemberRoles,
      eq(workspaceMemberRoles.workspace_member_id, workspaceMembers.id),
    )
    .leftJoin(
      roles,
      and(
        eq(roles.id, workspaceMemberRoles.role_id),
        eq(roles.realm, AuthRealm.Workspace),
      ),
    )
    .where(memberId ? eq(workspaceMembers.id, memberId) : undefined)
    .orderBy(asc(users.display_name), asc(workspaceMembers.id));

  return workspaceMemberMappingService.mapRowsToMembers(rows);
}

async function list(
  executor: AccessDatabaseExecutor,
): Promise<WorkspaceMemberDto[]> {
  return load(executor);
}

async function findById(
  executor: AccessDatabaseExecutor,
  memberId: string,
): Promise<WorkspaceMemberDto | null> {
  const [member] = await load(executor, memberId);
  return member ?? null;
}

export const workspaceMemberReadService = {
  findById,
  list,
} as const;
