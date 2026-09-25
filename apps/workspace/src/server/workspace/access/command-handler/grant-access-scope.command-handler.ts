import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import type { GrantAccessScopeRequestDto } from "@invessiv/common/contracts/auth/grant-access-scope-request.dto";
import type { GrantAccessScopeResult } from "@invessiv/common/contracts/auth/results/grant-access-scope-result";
import { getDrizzleDatabaseClient, PostgresErrorCode } from "@invessiv/db/core";
import { workspaceMemberScopedRoles } from "@invessiv/db/record-configuration";
import { WorkspaceMemberScopedRolesConstraintName } from "@invessiv/db/constraint-names/auth/workspace-member-scoped-roles-constraint-names";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { AccessScopeCommandErrorMessage } from "@/server/workspace/access/constants/access-scope-command-errors";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { accessScopeMappingService } from "@/server/workspace/access/services/access-scope-mapping-service";
import { accessScopeAssignmentService } from "@/server/workspace/access/services/access-scope-assignment-service";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";
import { workspaceMemberVersionService } from "@/server/workspace/access/services/workspace-member-version-service";
import { securityEventService } from "@/server/shared/services/security-event-service";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

export async function grantAccessScope(
  memberId: string,
  input: GrantAccessScopeRequestDto,
  actor: WorkspaceActor,
): Promise<GrantAccessScopeResult> {
  if (!accessSchemas.entityId.safeParse(memberId).success) {
    return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
  }

  const validation = accessSchemas.grantAccessScope.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: WorkspaceMemberErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const { roleId, scope, version } = validation.data;
  const db = getDrizzleDatabaseClient();

  try {
    return await db.transaction(async (tx): Promise<GrantAccessScopeResult> => {
      const member = await workspaceMemberReadService.findById(tx, memberId);
      if (!member) {
        return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
      }
      if (member.isOwner) {
        return {
          ok: false,
          code: WorkspaceMemberErrorCode.AccessScopeNotAssignable,
        };
      }

      const assignmentError = await accessScopeAssignmentService.validate(tx, {
        roleId,
        scope,
      });
      if (assignmentError) return { ok: false, code: assignmentError };

      const projectId =
        scope.type === AccessScopeType.Project ? scope.projectId : null;

      const bump = await workspaceMemberVersionService.bump(
        tx,
        memberId,
        version,
      );
      if (!bump.ok) {
        return bump;
      }

      const now = new Date();
      const id = crypto.randomUUID();
      await tx.insert(workspaceMemberScopedRoles).values({
        id,
        workspace_member_id: memberId,
        role_id: roleId,
        role_realm: AuthRealm.Workspace,
        role_scope_assignable: true,
        customer_id: scope.customerId,
        project_id: projectId,
        assigned_by_user_id: actor.userId,
        assigned_at: now,
      });
      await securityEventService.createSecurityEvent(tx, {
        type: SecurityEventType.WorkspaceMemberAccessScopeGranted,
        actor: { type: ActorType.User, userId: actor.userId },
        subjectType: SecuritySubjectType.WorkspaceMember,
        subjectId: memberId,
        metadata: {
          roleId,
          customerId: scope.customerId,
          projectId,
        },
        occurredAt: now,
      });

      const refreshed = await workspaceMemberReadService.findById(tx, memberId);
      if (!refreshed) {
        throw new Error(AccessScopeCommandErrorMessage.MemberMissingAfterGrant);
      }

      return {
        ok: true,
        accessScope: accessScopeMappingService.mapRow({
          id,
          workspace_member_id: memberId,
          role_id: roleId,
          customer_id: scope.customerId,
          project_id: projectId,
          assigned_by_user_id: actor.userId,
          assigned_at: now,
        }),
        member: refreshed,
      };
    });
  } catch (error: unknown) {
    const constraint = postgresErrorService.getViolatedConstraint(
      error,
      PostgresErrorCode.UniqueViolation,
    );
    if (
      constraint === WorkspaceMemberScopedRolesConstraintName.CustomerUnique ||
      constraint === WorkspaceMemberScopedRolesConstraintName.ProjectUnique
    ) {
      return {
        ok: false,
        code: WorkspaceMemberErrorCode.AccessScopeAlreadyGranted,
      };
    }

    throw error;
  }
}
