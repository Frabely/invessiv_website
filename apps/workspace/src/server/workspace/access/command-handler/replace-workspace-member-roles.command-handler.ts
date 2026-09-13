import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { ReplaceWorkspaceMemberRolesRequestDto } from "@invessiv/common/contracts/auth/replace-workspace-member-roles-request.dto";
import type { ReplaceWorkspaceMemberRolesResult } from "@invessiv/common/contracts/auth/results/replace-workspace-member-roles-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { workspaceMemberRoles } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { roleAssignmentService } from "@/server/workspace/access/services/role-assignment-service";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";
import { workspaceMemberVersionService } from "@/server/workspace/access/services/workspace-member-version-service";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";

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

  const { roleIds, version } = validation.data;
  const db = getDrizzleDatabaseClient();

  return db.transaction(
    async (tx): Promise<ReplaceWorkspaceMemberRolesResult> => {
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
      if (roleIds.length === 0 && !current.isOwner) {
        return { ok: false, code: WorkspaceMemberErrorCode.MemberWithoutRole };
      }

      const addedRoleIds = roleIds.filter(
        (roleId) => !currentRoleIds.includes(roleId),
      );
      const removedRoleIds = currentRoleIds.filter(
        (roleId) => !roleIds.includes(roleId),
      );
      if (addedRoleIds.length === 0 && removedRoleIds.length === 0) {
        return { ok: true, member: current };
      }

      const bump = await workspaceMemberVersionService.bump(
        tx,
        memberId,
        version,
      );
      if (!bump.ok) {
        return bump;
      }

      const now = new Date();

      if (removedRoleIds.length > 0) {
        await tx
          .delete(workspaceMemberRoles)
          .where(
            and(
              eq(workspaceMemberRoles.workspace_member_id, memberId),
              inArray(workspaceMemberRoles.role_id, removedRoleIds),
            ),
          );
      }
      if (addedRoleIds.length > 0) {
        await tx.insert(workspaceMemberRoles).values(
          addedRoleIds.map((roleId) => ({
            workspace_member_id: memberId,
            role_id: roleId,
            role_realm: AuthRealm.Workspace,
            assigned_by_user_id: actor.userId,
            assigned_at: now,
          })),
        );
      }

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
    },
  );
}
