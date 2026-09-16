import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { UpdateWorkspaceMemberStatusRequestDto } from "@invessiv/common/contracts/auth/update-workspace-member-status-request.dto";
import type { UpdateWorkspaceMemberStatusResult } from "@invessiv/common/contracts/auth/results/update-workspace-member-status-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { memberResponsibilityLockService } from "@/server/workspace/access/services/responsibilities/member-responsibility-lock-service";
import { responsibilityCounterService } from "@/server/workspace/access/services/responsibilities/responsibility-counter-registry";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";
import { workspaceMemberVersionService } from "@/server/workspace/access/services/workspace-member-version-service";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";
import { workspaceOwnerInvariantService } from "@/server/workspace/auth/services/workspace-owner-invariant-service";

export async function updateWorkspaceMemberStatus(
  memberId: string,
  input: UpdateWorkspaceMemberStatusRequestDto,
  actor: WorkspaceActor,
): Promise<UpdateWorkspaceMemberStatusResult> {
  if (!accessSchemas.entityId.safeParse(memberId).success) {
    return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
  }

  const validation = accessSchemas.updateWorkspaceMemberStatus.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: WorkspaceMemberErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const desiredActive = validation.data.active;
  if (!desiredActive && memberId === actor.workspaceMemberId) {
    return { ok: false, code: WorkspaceMemberErrorCode.SelfDeactivation };
  }

  const db = getDrizzleDatabaseClient();
  return db.transaction(
    async (tx): Promise<UpdateWorkspaceMemberStatusResult> => {
      const activeOwnerMemberIds = desiredActive
        ? []
        : await workspaceOwnerInvariantService.lockOwnerAssignmentsAndFindActiveOwners(
            tx,
          );
      const current = await workspaceMemberReadService.findById(tx, memberId);

      if (!current) {
        return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
      }
      if (current.active === desiredActive) {
        return {
          ok: false,
          code: desiredActive
            ? WorkspaceMemberErrorCode.MemberAlreadyActive
            : WorkspaceMemberErrorCode.MemberAlreadyInactive,
        };
      }
      if (
        !desiredActive &&
        activeOwnerMemberIds.includes(memberId) &&
        activeOwnerMemberIds.length <= 1
      ) {
        return { ok: false, code: WorkspaceMemberErrorCode.LastActiveOwner };
      }

      if (!desiredActive) {
        // A parallel assignment holds FOR SHARE on this row; waiting here makes the count see it.
        await memberResponsibilityLockService.lockMemberForDeactivation(
          tx,
          memberId,
        );
        const responsibilityCounts =
          await responsibilityCounterService.countOpenByMemberId(tx, memberId);
        if (Object.values(responsibilityCounts).some((count) => count > 0)) {
          return {
            ok: false,
            code: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
            responsibilityCounts,
          };
        }
      }

      const write = await workspaceMemberVersionService.updateStatus(
        tx,
        memberId,
        validation.data.version,
        desiredActive,
      );
      if (!write.ok) {
        return write;
      }

      await securityEventService.createSecurityEvent(tx, {
        type: desiredActive
          ? SecurityEventType.WorkspaceMemberActivated
          : SecurityEventType.WorkspaceMemberDeactivated,
        actor: { type: ActorType.User, userId: actor.userId },
        subjectType: SecuritySubjectType.WorkspaceMember,
        subjectId: memberId,
        occurredAt: new Date(),
      });

      const member = await workspaceMemberReadService.findById(tx, memberId);
      if (!member) {
        throw new Error("Workspace member is missing after updating status");
      }
      return { ok: true, member };
    },
  );
}
