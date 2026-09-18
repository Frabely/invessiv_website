import "server-only";

import { and, eq, inArray } from "drizzle-orm";

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
 * Loads identity, membership and the permissions of all active workspace roles, plus the scoped
 * roles in a parallel query. The scoped query resolves the member by subquery so it never waits
 * for the first one.
 * Throws on database errors; the gates translate that into a closed door.
 */
export async function resolveWorkspaceActor(
  clerkUserId: string,
): Promise<ResolveWorkspaceActorResult> {
  const db = getDrizzleDatabaseClient();

  const rowsQuery = db
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

  const scopedRowsQuery = db
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
      inArray(
        workspaceMemberScopedRoles.workspace_member_id,
        db
          .select({ id: workspaceMembers.id })
          .from(workspaceMembers)
          .innerJoin(users, eq(users.id, workspaceMembers.user_id))
          .where(eq(users.clerk_user_id, clerkUserId)),
      ),
    );

  const [rows, scopedRows] = await Promise.all([rowsQuery, scopedRowsQuery]);

  return workspaceActorMappingService.mapRowsToResolution(rows, scopedRows);
}
