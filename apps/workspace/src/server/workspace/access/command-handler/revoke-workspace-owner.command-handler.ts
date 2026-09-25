import "server-only";

import { and, eq } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { ChangeWorkspaceOwnerRequestDto } from "@invessiv/common/contracts/auth/change-workspace-owner-request.dto";
import type { ChangeWorkspaceOwnerResult } from "@invessiv/common/contracts/auth/results/change-workspace-owner-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { workspaceMemberRoles } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";
import { workspaceMemberVersionService } from "@/server/workspace/access/services/workspace-member-version-service";
import { securityEventService } from "@/server/shared/services/security-event-service";
import { workspaceOwnerInvariantService } from "@/server/workspace/auth/services/workspace-owner-invariant-service";

export async function revokeWorkspaceOwner(
  memberId: string,
  input: ChangeWorkspaceOwnerRequestDto,
  actor: WorkspaceActor,
): Promise<ChangeWorkspaceOwnerResult> {
  if (!accessSchemas.entityId.safeParse(memberId).success) {
    return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
  }

  const validation = accessSchemas.changeWorkspaceOwner.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: WorkspaceMemberErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  // Only another owner can take the owner role away, so no owner can lock themselves out.
  if (memberId === actor.workspaceMemberId) {
    return { ok: false, code: WorkspaceMemberErrorCode.SelfOwnerRevocation };
  }

  const db = getDrizzleDatabaseClient();

  return db.transaction(async (tx): Promise<ChangeWorkspaceOwnerResult> => {
    // Lock first: every check below must see the owner set after concurrent revocations commit.
    const activeOwnerMemberIds =
      await workspaceOwnerInvariantService.lockOwnerAssignmentsAndFindActiveOwners(
        tx,
      );

    const current = await workspaceMemberReadService.findById(tx, memberId);
    if (!current) {
      return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
    }
    if (!current.isOwner) {
      return { ok: false, code: WorkspaceMemberErrorCode.NotOwner };
    }
    if (
      activeOwnerMemberIds.includes(memberId) &&
      activeOwnerMemberIds.length <= 1
    ) {
      return { ok: false, code: WorkspaceMemberErrorCode.LastActiveOwner };
    }
    // Without another role the member would silently lose every permission.
    if (current.roles.length === 0) {
      return { ok: false, code: WorkspaceMemberErrorCode.MemberWithoutRole };
    }

    const bump = await workspaceMemberVersionService.bump(
      tx,
      memberId,
      validation.data.version,
    );
    if (!bump.ok) {
      return bump;
    }

    const now = new Date();
    await tx
      .delete(workspaceMemberRoles)
      .where(
        and(
          eq(workspaceMemberRoles.workspace_member_id, memberId),
          eq(
            workspaceMemberRoles.role_id,
            workspaceOwnerInvariantService.ownerRoleId,
          ),
        ),
      );

    await securityEventService.createSecurityEvent(tx, {
      type: SecurityEventType.WorkspaceOwnerRevoked,
      actor: { type: ActorType.User, userId: actor.userId },
      subjectType: SecuritySubjectType.WorkspaceMember,
      subjectId: memberId,
      occurredAt: now,
    });

    const member = await workspaceMemberReadService.findById(tx, memberId);
    if (!member) {
      throw new Error("Workspace member is missing after revoking owner");
    }

    return { ok: true, member };
  });
}
