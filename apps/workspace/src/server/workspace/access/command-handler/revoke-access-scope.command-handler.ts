import "server-only";

import { and, eq } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { RevokeAccessScopeRequestDto } from "@invessiv/common/contracts/auth/revoke-access-scope-request.dto";
import type { RevokeAccessScopeResult } from "@invessiv/common/contracts/auth/results/revoke-access-scope-result";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { workspaceMemberScopedRoles } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { AccessScopeCommandErrorMessage } from "@/server/workspace/access/constants/access-scope-command-errors";
import { memberActiveAccessService } from "@/server/workspace/access/services/member-active-access-service";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";
import { workspaceMemberVersionService } from "@/server/workspace/access/services/workspace-member-version-service";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";

async function findMemberAccessScope(
  tx: ContactDatabaseTransaction,
  memberId: string,
  scopeId: string,
) {
  const [scope] = await tx
    .select()
    .from(workspaceMemberScopedRoles)
    .where(
      and(
        eq(workspaceMemberScopedRoles.id, scopeId),
        eq(workspaceMemberScopedRoles.workspace_member_id, memberId),
      ),
    )
    .limit(1);

  return scope ?? null;
}

async function hasRemainingActiveAccess(
  tx: ContactDatabaseTransaction,
  memberId: string,
  scopeId: string,
): Promise<boolean> {
  const [hasScopedRole, hasWorkspaceRole] = await Promise.all([
    memberActiveAccessService.hasActiveScopedRole(tx, memberId, scopeId),
    memberActiveAccessService.hasActiveWorkspaceRole(tx, memberId),
  ]);

  return hasScopedRole || hasWorkspaceRole;
}

export async function revokeAccessScope(
  memberId: string,
  scopeId: string,
  input: RevokeAccessScopeRequestDto,
  actor: WorkspaceActor,
): Promise<RevokeAccessScopeResult> {
  if (!accessSchemas.entityId.safeParse(memberId).success) {
    return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
  }
  if (!accessSchemas.entityId.safeParse(scopeId).success) {
    return { ok: false, code: WorkspaceMemberErrorCode.AccessScopeNotFound };
  }

  const validation = accessSchemas.revokeAccessScope.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: WorkspaceMemberErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const db = getDrizzleDatabaseClient();
  return db.transaction(async (tx): Promise<RevokeAccessScopeResult> => {
    const member = await workspaceMemberReadService.findById(tx, memberId);
    if (!member) {
      return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
    }

    const scope = await findMemberAccessScope(tx, memberId, scopeId);
    if (!scope) {
      return {
        ok: false,
        code: WorkspaceMemberErrorCode.AccessScopeNotFound,
      };
    }
    if (
      !member.isOwner &&
      !(await hasRemainingActiveAccess(tx, memberId, scopeId))
    ) {
      return {
        ok: false,
        code: WorkspaceMemberErrorCode.MemberWithoutRole,
      };
    }

    const bump = await workspaceMemberVersionService.bump(
      tx,
      memberId,
      validation.data.version,
    );
    if (!bump.ok) {
      return bump;
    }

    await tx
      .delete(workspaceMemberScopedRoles)
      .where(eq(workspaceMemberScopedRoles.id, scopeId));

    const now = new Date();
    await securityEventService.createSecurityEvent(tx, {
      type: SecurityEventType.WorkspaceMemberAccessScopeRevoked,
      actor: { type: ActorType.User, userId: actor.userId },
      subjectType: SecuritySubjectType.WorkspaceMember,
      subjectId: memberId,
      metadata: {
        roleId: scope.role_id,
        customerId: scope.customer_id,
        projectId: scope.project_id,
      },
      occurredAt: now,
    });

    const refreshed = await workspaceMemberReadService.findById(tx, memberId);
    if (!refreshed) {
      throw new Error(
        AccessScopeCommandErrorMessage.MemberMissingAfterRevocation,
      );
    }

    return { ok: true, member: refreshed };
  });
}
