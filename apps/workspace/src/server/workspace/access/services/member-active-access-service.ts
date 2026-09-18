import "server-only";

import { and, eq, ne } from "drizzle-orm";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  roles,
  workspaceMemberRoles,
  workspaceMemberScopedRoles,
} from "@invessiv/db/record-configuration";

/** True when the member holds a scoped assignment whose role is still active. */
async function hasActiveScopedRole(
  tx: ContactDatabaseTransaction,
  memberId: string,
  excludeScopeId?: string,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: workspaceMemberScopedRoles.id })
    .from(workspaceMemberScopedRoles)
    .innerJoin(roles, eq(roles.id, workspaceMemberScopedRoles.role_id))
    .where(
      and(
        eq(workspaceMemberScopedRoles.workspace_member_id, memberId),
        eq(roles.active, true),
        excludeScopeId
          ? ne(workspaceMemberScopedRoles.id, excludeScopeId)
          : undefined,
      ),
    )
    .limit(1);

  return Boolean(row);
}

/** True when the member holds a workspace-wide assignment whose role is still active. */
async function hasActiveWorkspaceRole(
  tx: ContactDatabaseTransaction,
  memberId: string,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: workspaceMemberRoles.role_id })
    .from(workspaceMemberRoles)
    .innerJoin(roles, eq(roles.id, workspaceMemberRoles.role_id))
    .where(
      and(
        eq(workspaceMemberRoles.workspace_member_id, memberId),
        eq(roles.active, true),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export const memberActiveAccessService = {
  hasActiveScopedRole,
  hasActiveWorkspaceRole,
} as const;
