import "server-only";

import { and, eq } from "drizzle-orm";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  rolePermissions,
  roles,
  users,
  workspaceMemberRoles,
  workspaceMembers,
  workspaceMemberScopedRoles,
} from "@invessiv/db/record-configuration";
import type { ResolveWorkspaceActorResult } from "@/server/workspace/auth/resolve-workspace-actor-types";
import { workspaceActorMappingService } from "@/server/workspace/auth/services/workspace-actor/workspace-actor-mapping-service";

/**
 * Loads identity, membership and the permissions of all active workspace roles in one query.
 * Throws on database errors; the gates translate that into a closed door.
 */
export async function resolveWorkspaceActor(
  clerkUserId: string,
): Promise<ResolveWorkspaceActorResult> {
  const db = getDrizzleDatabaseClient();

  const rows = await db
    .select({
      user_id: users.id,
      user_active: users.active,
      workspace_member_id: workspaceMembers.id,
      member_active: workspaceMembers.active,
      permission_key: rolePermissions.permission_key,
    })
    .from(users)
    .leftJoin(workspaceMembers, eq(workspaceMembers.user_id, users.id))
    .leftJoin(
      workspaceMemberRoles,
      eq(workspaceMemberRoles.workspace_member_id, workspaceMembers.id),
    )
    .leftJoin(
      roles,
      and(
        eq(roles.id, workspaceMemberRoles.role_id),
        eq(roles.realm, AuthRealm.Workspace),
        eq(roles.active, true),
      ),
    )
    .leftJoin(
      rolePermissions,
      and(
        eq(rolePermissions.role_id, roles.id),
        eq(rolePermissions.realm, AuthRealm.Workspace),
      ),
    )
    .where(eq(users.clerk_user_id, clerkUserId));

  const resolution = workspaceActorMappingService.mapRowsToResolution(rows);
  if (!resolution.ok) return resolution;

  const scopedRows = await db
    .select({
      workspace_member_id: workspaceMemberScopedRoles.workspace_member_id,
      customer_id: workspaceMemberScopedRoles.customer_id,
      project_id: workspaceMemberScopedRoles.project_id,
      permission_key: rolePermissions.permission_key,
      permission_scope_assignable: rolePermissions.permission_scope_assignable,
    })
    .from(workspaceMemberScopedRoles)
    .innerJoin(
      roles,
      and(
        eq(roles.id, workspaceMemberScopedRoles.role_id),
        eq(roles.realm, AuthRealm.Workspace),
        eq(roles.active, true),
        eq(roles.scope_assignable, true),
      ),
    )
    .innerJoin(
      rolePermissions,
      and(
        eq(rolePermissions.role_id, roles.id),
        eq(rolePermissions.realm, AuthRealm.Workspace),
        eq(rolePermissions.permission_scope_assignable, true),
      ),
    )
    .where(
      eq(
        workspaceMemberScopedRoles.workspace_member_id,
        resolution.actor.workspaceMemberId,
      ),
    );

  return workspaceActorMappingService.mapRowsToResolution(rows, scopedRows);
}
