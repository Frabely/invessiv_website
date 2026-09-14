import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
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
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";
import { workspaceOwnerInvariantService } from "@/server/workspace/auth/services/workspace-owner-invariant-service";

export async function grantWorkspaceOwner(
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

  const db = getDrizzleDatabaseClient();

  return db.transaction(async (tx): Promise<ChangeWorkspaceOwnerResult> => {
    const current = await workspaceMemberReadService.findById(tx, memberId);
    if (!current) {
      return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
    }
    if (current.isOwner) {
      return { ok: false, code: WorkspaceMemberErrorCode.AlreadyOwner };
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
    await tx.insert(workspaceMemberRoles).values({
      workspace_member_id: memberId,
      role_id: workspaceOwnerInvariantService.ownerRoleId,
      role_realm: AuthRealm.Workspace,
      assigned_by_user_id: actor.userId,
      assigned_at: now,
    });

    await securityEventService.createSecurityEvent(tx, {
      type: SecurityEventType.WorkspaceOwnerGranted,
      actor: { type: ActorType.User, userId: actor.userId },
      subjectType: SecuritySubjectType.WorkspaceMember,
      subjectId: memberId,
      occurredAt: now,
    });

    const member = await workspaceMemberReadService.findById(tx, memberId);
    if (!member) {
      throw new Error("Workspace member is missing after granting owner");
    }

    return { ok: true, member };
  });
}
