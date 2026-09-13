import "server-only";

import { and, eq } from "drizzle-orm";

import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  roles,
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";

const OWNER_ROLE_ID = SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.WorkspaceOwner].id;

/** An owner only counts while role, membership and user are all active. */
async function findActiveOwnerMemberIds(
  executor: Pick<ContactDatabaseTransaction, "select">,
): Promise<string[]> {
  const rows = await executor
    .select({ memberId: workspaceMemberRoles.workspace_member_id })
    .from(workspaceMemberRoles)
    .innerJoin(roles, eq(roles.id, workspaceMemberRoles.role_id))
    .innerJoin(
      workspaceMembers,
      eq(workspaceMembers.id, workspaceMemberRoles.workspace_member_id),
    )
    .innerJoin(users, eq(users.id, workspaceMembers.user_id))
    .where(
      and(
        eq(roles.system_key, SystemRoleKey.WorkspaceOwner),
        eq(roles.active, true),
        eq(workspaceMembers.active, true),
        eq(users.active, true),
      ),
    );

  return rows.map((row) => row.memberId);
}

/**
 * Locks every owner assignment before counting, so two owners revoking each other in parallel are
 * serialized: the second transaction re-reads after the first commits and sees the last owner.
 */
async function lockOwnerAssignmentsAndFindActiveOwners(
  tx: ContactDatabaseTransaction,
): Promise<string[]> {
  await tx
    .select({ memberId: workspaceMemberRoles.workspace_member_id })
    .from(workspaceMemberRoles)
    .where(eq(workspaceMemberRoles.role_id, OWNER_ROLE_ID))
    .for("update");

  return findActiveOwnerMemberIds(tx);
}

export const workspaceOwnerInvariantService = {
  ownerRoleId: OWNER_ROLE_ID,
  findActiveOwnerMemberIds,
  lockOwnerAssignmentsAndFindActiveOwners,
} as const;
