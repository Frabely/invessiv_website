import "server-only";

import { and, eq } from "drizzle-orm";

import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  roles,
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";

type OwnerLookupExecutor = Pick<ContactDatabaseTransaction, "select">;

/**
 * Answers whether a Clerk identity currently holds the workspace owner role — user, membership and
 * role all active. Only a fact lookup: it grants nothing, and database errors propagate so every
 * caller fails closed.
 */
async function findActiveOwnerUserId(
  executor: OwnerLookupExecutor,
  clerkUserId: string,
): Promise<string | null> {
  const rows = await executor
    .select({ userId: users.id })
    .from(users)
    .innerJoin(workspaceMembers, eq(workspaceMembers.user_id, users.id))
    .innerJoin(
      workspaceMemberRoles,
      eq(workspaceMemberRoles.workspace_member_id, workspaceMembers.id),
    )
    .innerJoin(roles, eq(roles.id, workspaceMemberRoles.role_id))
    .where(
      and(
        eq(users.clerk_user_id, clerkUserId),
        eq(users.active, true),
        eq(workspaceMembers.active, true),
        eq(roles.system_key, SystemRoleKey.WorkspaceOwner),
        eq(roles.active, true),
      ),
    )
    .limit(1);

  return rows[0]?.userId ?? null;
}

export const workspaceOwnerLookupService = {
  findActiveOwnerUserId,
} as const;
