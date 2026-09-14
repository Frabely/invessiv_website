import "server-only";

import { inArray } from "drizzle-orm";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { roles } from "@invessiv/db/record-configuration";
import type {
  AccessDatabaseExecutor,
  RoleAssignabilityResult,
} from "@/server/workspace/access/access-types";

/**
 * A role is assignable when it exists in the workspace realm and is active. An inactive role that
 * the member already holds may stay, so saving an unrelated change never forces its removal.
 */
async function checkAssignable(
  executor: AccessDatabaseExecutor,
  args: { roleIds: readonly string[]; currentRoleIds: readonly string[] },
): Promise<RoleAssignabilityResult> {
  if (args.roleIds.length === 0) {
    return { ok: true };
  }

  const rows = await executor
    .select({
      id: roles.id,
      realm: roles.realm,
      system_key: roles.system_key,
      active: roles.active,
    })
    .from(roles)
    .where(inArray(roles.id, [...args.roleIds]))
    .for("update");

  if (rows.some((row) => row.system_key === SystemRoleKey.WorkspaceOwner)) {
    return { ok: false, code: WorkspaceMemberErrorCode.OwnerRoleNotAssignable };
  }

  const current = new Set(args.currentRoleIds);
  const allAssignable =
    rows.length === args.roleIds.length &&
    rows.every(
      (row) =>
        row.realm === AuthRealm.Workspace &&
        (row.active || current.has(row.id)),
    );

  return allAssignable
    ? { ok: true }
    : { ok: false, code: WorkspaceMemberErrorCode.RoleNotAssignable };
}

export const roleAssignmentService = {
  checkAssignable,
} as const;
