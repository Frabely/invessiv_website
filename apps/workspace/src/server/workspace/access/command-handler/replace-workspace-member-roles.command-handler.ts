import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { ReplaceWorkspaceMemberRolesRequestDto } from "@invessiv/common/contracts/auth/replace-workspace-member-roles-request.dto";
import type { ReplaceWorkspaceMemberRolesResult } from "@invessiv/common/contracts/auth/results/replace-workspace-member-roles-result";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { workspaceMemberRoles } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { memberActiveAccessService } from "@/server/workspace/access/services/member-active-access-service";
import { roleAssignmentService } from "@/server/workspace/access/services/role-assignment-service";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";
import { workspaceMemberVersionService } from "@/server/workspace/access/services/workspace-member-version-service";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";

function diffRoleIds(
  currentRoleIds: readonly string[],
  roleIds: readonly string[],
) {
  return {
    addedRoleIds: roleIds.filter((roleId) => !currentRoleIds.includes(roleId)),
    removedRoleIds: currentRoleIds.filter(
      (roleId) => !roleIds.includes(roleId),
    ),
  };
}

/**
 * Dropping every workspace role is fine for an owner (the owner role remains) or while an active
 * scoped role still grants access; otherwise the member would end up without any permission.
 */
async function wouldLeaveMemberWithoutAccess(
  tx: ContactDatabaseTransaction,
  member: WorkspaceMemberDto,
  roleIds: readonly string[],
): Promise<boolean> {
  if (roleIds.length > 0 || member.isOwner) {
    return false;
  }

  return !(await memberActiveAccessService.hasActiveScopedRole(tx, member.id));
}

async function applyRoleChanges(
  tx: ContactDatabaseTransaction,
  args: {
    memberId: string;
    addedRoleIds: readonly string[];
    removedRoleIds: readonly string[];
    assignedByUserId: string;
    assignedAt: Date;
  },
): Promise<void> {
  const { memberId, addedRoleIds, removedRoleIds } = args;

  if (removedRoleIds.length > 0) {
    await tx
      .delete(workspaceMemberRoles)
      .where(
        and(
          eq(workspaceMemberRoles.workspace_member_id, memberId),
          inArray(workspaceMemberRoles.role_id, [...removedRoleIds]),
        ),
      );
  }
  if (addedRoleIds.length > 0) {
    await tx.insert(workspaceMemberRoles).values(
      addedRoleIds.map((roleId) => ({
        workspace_member_id: memberId,
        role_id: roleId,
        role_realm: AuthRealm.Workspace,
        assigned_by_user_id: args.assignedByUserId,
        assigned_at: args.assignedAt,
      })),
    );
  }
}

async function replaceRolesInTransaction(
  tx: ContactDatabaseTransaction,
  memberId: string,
  change: { roleIds: string[]; version: number },
  actor: WorkspaceActor,
): Promise<ReplaceWorkspaceMemberRolesResult> {
  const { roleIds, version } = change;

  const current = await workspaceMemberReadService.findById(tx, memberId);
  if (!current) {
    return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
  }

  const currentRoleIds = current.roles.map((role) => role.id);
  const assignability = await roleAssignmentService.checkAssignable(tx, {
    roleIds,
    currentRoleIds,
  });
  if (!assignability.ok) {
    return assignability;
  }
  if (await wouldLeaveMemberWithoutAccess(tx, current, roleIds)) {
    return { ok: false, code: WorkspaceMemberErrorCode.MemberWithoutRole };
  }

  const { addedRoleIds, removedRoleIds } = diffRoleIds(currentRoleIds, roleIds);
  if (addedRoleIds.length === 0 && removedRoleIds.length === 0) {
    return { ok: true, member: current };
  }

  const bump = await workspaceMemberVersionService.bump(tx, memberId, version);
  if (!bump.ok) {
    return bump;
  }

  const now = new Date();
  await applyRoleChanges(tx, {
    memberId,
    addedRoleIds,
    removedRoleIds,
    assignedByUserId: actor.userId,
    assignedAt: now,
  });
  await securityEventService.createSecurityEvent(tx, {
    type: SecurityEventType.WorkspaceMemberRolesChanged,
    actor: { type: ActorType.User, userId: actor.userId },
    subjectType: SecuritySubjectType.WorkspaceMember,
    subjectId: memberId,
    metadata: { addedRoleIds, removedRoleIds },
    occurredAt: now,
  });

  const member = await workspaceMemberReadService.findById(tx, memberId);
  if (!member) {
    throw new Error("Workspace member is missing after its role change");
  }

  return { ok: true, member };
}

/** Replaces the non-owner roles. The owner assignment is never touched here. */
export async function replaceWorkspaceMemberRoles(
  memberId: string,
  input: ReplaceWorkspaceMemberRolesRequestDto,
  actor: WorkspaceActor,
): Promise<ReplaceWorkspaceMemberRolesResult> {
  if (!accessSchemas.entityId.safeParse(memberId).success) {
    return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
  }

  const validation = accessSchemas.replaceWorkspaceMemberRoles.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: WorkspaceMemberErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const db = getDrizzleDatabaseClient();

  return db.transaction((tx) =>
    replaceRolesInTransaction(tx, memberId, validation.data, actor),
  );
}
