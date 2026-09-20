import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { AccessScopeAssignmentDto } from "@invessiv/common/contracts/auth/access-scope-assignment.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  workspaceMemberRoles,
  workspaceMemberScopedRoles,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScopeAssignmentKey } from "@/common/patterns/access/access-scope-tree";
import { accessScopeAssignmentService } from "@/server/workspace/access/services/access-scope-assignment-service";
import { roleAssignmentService } from "@/server/workspace/access/services/role-assignment-service";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";
import { workspaceMemberVersionService } from "@/server/workspace/access/services/workspace-member-version-service";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";

function scopeFromRow(
  row: typeof workspaceMemberScopedRoles.$inferSelect,
): AccessScopeAssignmentDto {
  return {
    roleId: row.role_id,
    scope: row.project_id
      ? {
          type: AccessScopeType.Project,
          customerId: row.customer_id,
          projectId: row.project_id,
        }
      : { type: AccessScopeType.Customer, customerId: row.customer_id },
  };
}

export const memberRoleAssignmentService = {
  async replace(
    memberId: string,
    input: {
      roleIds?: readonly string[];
      accessScopeAssignments?: readonly AccessScopeAssignmentDto[];
      version: number;
    },
    actor: WorkspaceActor,
  ) {
    return getDrizzleDatabaseClient().transaction(async (tx) => {
      const member = await workspaceMemberReadService.findById(tx, memberId);
      if (!member)
        return {
          ok: false as const,
          code: WorkspaceMemberErrorCode.MemberNotFound,
        };
      const currentRows = await tx
        .select()
        .from(workspaceMemberScopedRoles)
        .where(eq(workspaceMemberScopedRoles.workspace_member_id, memberId));
      const currentScopes = currentRows.map(scopeFromRow);
      const roleIds = [
        ...(input.roleIds ?? member.roles.map((role) => role.id)),
      ];
      const accessScopeAssignments = [
        ...(input.accessScopeAssignments ?? currentScopes),
      ];
      if (member.isOwner && accessScopeAssignments.length > 0)
        return {
          ok: false as const,
          code: WorkspaceMemberErrorCode.AccessScopeNotAssignable,
        };
      const assignability = await roleAssignmentService.checkAssignable(tx, {
        roleIds,
        currentRoleIds: member.roles.map((role) => role.id),
      });
      if (!assignability.ok) return assignability;
      const currentByKey = new Map(
        currentRows.map((row) => [
          accessScopeAssignmentKey(scopeFromRow(row)),
          row,
        ]),
      );
      const desiredByKey = new Map(
        accessScopeAssignments.map((assignment) => [
          accessScopeAssignmentKey(assignment),
          assignment,
        ]),
      );
      const addedScopes = [...desiredByKey]
        .filter(([key]) => !currentByKey.has(key))
        .map(([, assignment]) => assignment);
      const removedScopes = [...currentByKey]
        .filter(([key]) => !desiredByKey.has(key))
        .map(([, row]) => row);
      for (const assignment of addedScopes) {
        const error = await accessScopeAssignmentService.validate(
          tx,
          assignment,
        );
        if (error) return { ok: false as const, code: error };
      }
      if (
        !member.isOwner &&
        roleIds.length === 0 &&
        !(await accessScopeAssignmentService.hasActiveRole(
          tx,
          accessScopeAssignments.map((assignment) => assignment.roleId),
        ))
      )
        return {
          ok: false as const,
          code: WorkspaceMemberErrorCode.MemberWithoutRole,
        };
      const currentRoleIds = member.roles.map((role) => role.id);
      const addedRoleIds = roleIds.filter(
        (roleId) => !currentRoleIds.includes(roleId),
      );
      const removedRoleIds = currentRoleIds.filter(
        (roleId) => !roleIds.includes(roleId),
      );
      if (
        addedRoleIds.length === 0 &&
        removedRoleIds.length === 0 &&
        addedScopes.length === 0 &&
        removedScopes.length === 0
      )
        return { ok: true as const, member };
      const bump = await workspaceMemberVersionService.bump(
        tx,
        memberId,
        input.version,
      );
      if (!bump.ok) return bump;
      const now = new Date();
      if (removedRoleIds.length > 0)
        await tx
          .delete(workspaceMemberRoles)
          .where(
            and(
              eq(workspaceMemberRoles.workspace_member_id, memberId),
              inArray(workspaceMemberRoles.role_id, removedRoleIds),
            ),
          );
      if (addedRoleIds.length > 0)
        await tx.insert(workspaceMemberRoles).values(
          addedRoleIds.map((roleId) => ({
            workspace_member_id: memberId,
            role_id: roleId,
            role_realm: AuthRealm.Workspace,
            assigned_by_user_id: actor.userId,
            assigned_at: now,
          })),
        );
      if (removedScopes.length > 0)
        await tx.delete(workspaceMemberScopedRoles).where(
          inArray(
            workspaceMemberScopedRoles.id,
            removedScopes.map((row) => row.id),
          ),
        );
      if (addedScopes.length > 0)
        await tx.insert(workspaceMemberScopedRoles).values(
          addedScopes.map((assignment) => ({
            id: crypto.randomUUID(),
            workspace_member_id: memberId,
            role_id: assignment.roleId,
            role_realm: AuthRealm.Workspace,
            role_scope_assignable: true,
            customer_id: assignment.scope.customerId,
            project_id:
              assignment.scope.type === AccessScopeType.Project
                ? assignment.scope.projectId
                : null,
            assigned_by_user_id: actor.userId,
            assigned_at: now,
          })),
        );
      if (addedRoleIds.length > 0 || removedRoleIds.length > 0)
        await securityEventService.createSecurityEvent(tx, {
          type: SecurityEventType.WorkspaceMemberRolesChanged,
          actor: { type: ActorType.User, userId: actor.userId },
          subjectType: SecuritySubjectType.WorkspaceMember,
          subjectId: memberId,
          metadata: { addedRoleIds, removedRoleIds },
          occurredAt: now,
        });
      for (const assignment of addedScopes)
        await securityEventService.createSecurityEvent(tx, {
          type: SecurityEventType.WorkspaceMemberAccessScopeGranted,
          actor: { type: ActorType.User, userId: actor.userId },
          subjectType: SecuritySubjectType.WorkspaceMember,
          subjectId: memberId,
          metadata: {
            roleId: assignment.roleId,
            customerId: assignment.scope.customerId,
            projectId:
              assignment.scope.type === AccessScopeType.Project
                ? assignment.scope.projectId
                : null,
          },
          occurredAt: now,
        });
      for (const row of removedScopes)
        await securityEventService.createSecurityEvent(tx, {
          type: SecurityEventType.WorkspaceMemberAccessScopeRevoked,
          actor: { type: ActorType.User, userId: actor.userId },
          subjectType: SecuritySubjectType.WorkspaceMember,
          subjectId: memberId,
          metadata: {
            roleId: row.role_id,
            customerId: row.customer_id,
            projectId: row.project_id,
          },
          occurredAt: now,
        });
      const refreshed = await workspaceMemberReadService.findById(tx, memberId);
      if (!refreshed)
        throw new Error(
          "Workspace member is missing after role assignment replacement",
        );
      return { ok: true as const, member: refreshed };
    });
  },
} as const;
