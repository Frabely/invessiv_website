import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { AccessScopeAssignmentDto } from "@invessiv/common/contracts/auth/access-scope-assignment.dto";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  roles,
  workspaceMemberRoles,
  workspaceMemberScopedRoles,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScopeAssignmentKey } from "@/common/patterns/access/access-scope-tree";
import { accessScopeAssignmentService } from "@/server/workspace/access/services/access-scope-assignment-service";
import type {
  AccessDatabaseExecutor,
  RoleAssignabilityResult,
} from "@/server/workspace/access/access-types";
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

/** Inactive or scope-only roles may remain held, but cannot be newly assigned workspace-wide. */
async function checkAssignable(
  executor: AccessDatabaseExecutor,
  args: { roleIds: readonly string[]; currentRoleIds: readonly string[] },
): Promise<RoleAssignabilityResult> {
  if (args.roleIds.length === 0) return { ok: true };

  const rows = await executor
    .select({
      id: roles.id,
      realm: roles.realm,
      system_key: roles.system_key,
      active: roles.active,
      scope_assignable: roles.scope_assignable,
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
        (row.active || current.has(row.id)) &&
        (!row.scope_assignable || current.has(row.id)),
    );

  return allAssignable
    ? { ok: true }
    : { ok: false, code: WorkspaceMemberErrorCode.RoleNotAssignable };
}

type AssignmentInput = {
  roleIds?: readonly string[];
  accessScopeAssignments?: readonly AccessScopeAssignmentDto[];
  version: number;
};
type WorkspaceMember = NonNullable<
  Awaited<ReturnType<typeof workspaceMemberReadService.findById>>
>;
type ScopedRoleRow = typeof workspaceMemberScopedRoles.$inferSelect;
type AssignmentChanges = {
  addedRoleIds: string[];
  removedRoleIds: string[];
  addedScopes: AccessScopeAssignmentDto[];
  removedScopes: ScopedRoleRow[];
};

async function loadCurrentScopes(
  tx: ContactDatabaseTransaction,
  memberId: string,
): Promise<ScopedRoleRow[]> {
  return tx
    .select()
    .from(workspaceMemberScopedRoles)
    .where(eq(workspaceMemberScopedRoles.workspace_member_id, memberId));
}

function findScopeChanges(
  currentRows: ScopedRoleRow[],
  desiredScopes: readonly AccessScopeAssignmentDto[],
): Pick<AssignmentChanges, "addedScopes" | "removedScopes"> {
  const currentByKey = new Map(
    currentRows.map((row) => [
      accessScopeAssignmentKey(scopeFromRow(row)),
      row,
    ]),
  );
  const desiredByKey = new Map(
    desiredScopes.map((assignment) => [
      accessScopeAssignmentKey(assignment),
      assignment,
    ]),
  );
  return {
    addedScopes: [...desiredByKey]
      .filter(([key]) => !currentByKey.has(key))
      .map(([, assignment]) => assignment),
    removedScopes: [...currentByKey]
      .filter(([key]) => !desiredByKey.has(key))
      .map(([, row]) => row),
  };
}

async function validateAddedScopes(
  tx: ContactDatabaseTransaction,
  assignments: readonly AccessScopeAssignmentDto[],
) {
  for (const assignment of assignments) {
    const error = await accessScopeAssignmentService.validate(tx, assignment);
    if (error) return { ok: false as const, code: error };
  }
  return { ok: true as const };
}

async function buildAssignmentChanges(
  tx: ContactDatabaseTransaction,
  member: WorkspaceMember,
  currentRows: ScopedRoleRow[],
  input: AssignmentInput,
) {
  const currentRoleIds = member.roles.map((role) => role.id);
  const roleIds = [...(input.roleIds ?? currentRoleIds)];
  const desiredScopes = [
    ...(input.accessScopeAssignments ?? currentRows.map(scopeFromRow)),
  ];

  if (member.isOwner && desiredScopes.length > 0) {
    return {
      ok: false as const,
      code: WorkspaceMemberErrorCode.AccessScopeNotAssignable,
    };
  }

  const assignability = await checkAssignable(tx, {
    roleIds,
    currentRoleIds,
  });
  if (!assignability.ok) return assignability;

  const scopeChanges = findScopeChanges(currentRows, desiredScopes);
  const scopeValidation = await validateAddedScopes(
    tx,
    scopeChanges.addedScopes,
  );
  if (!scopeValidation.ok) return scopeValidation;

  if (
    !member.isOwner &&
    roleIds.length === 0 &&
    !(await accessScopeAssignmentService.hasActiveRole(
      tx,
      desiredScopes.map((assignment) => assignment.roleId),
    ))
  ) {
    return {
      ok: false as const,
      code: WorkspaceMemberErrorCode.MemberWithoutRole,
    };
  }

  return {
    ok: true as const,
    changes: {
      ...scopeChanges,
      addedRoleIds: roleIds.filter(
        (roleId) => !currentRoleIds.includes(roleId),
      ),
      removedRoleIds: currentRoleIds.filter(
        (roleId) => !roleIds.includes(roleId),
      ),
    },
  };
}

function hasAssignmentChanges(changes: AssignmentChanges): boolean {
  return (
    changes.addedRoleIds.length > 0 ||
    changes.removedRoleIds.length > 0 ||
    changes.addedScopes.length > 0 ||
    changes.removedScopes.length > 0
  );
}

async function persistRoleChanges(
  tx: ContactDatabaseTransaction,
  memberId: string,
  changes: AssignmentChanges,
  actor: WorkspaceActor,
  now: Date,
): Promise<void> {
  if (changes.removedRoleIds.length > 0) {
    await tx
      .delete(workspaceMemberRoles)
      .where(
        and(
          eq(workspaceMemberRoles.workspace_member_id, memberId),
          inArray(workspaceMemberRoles.role_id, changes.removedRoleIds),
        ),
      );
  }
  if (changes.addedRoleIds.length > 0) {
    await tx.insert(workspaceMemberRoles).values(
      changes.addedRoleIds.map((roleId) => ({
        workspace_member_id: memberId,
        role_id: roleId,
        role_realm: AuthRealm.Workspace,
        assigned_by_user_id: actor.userId,
        assigned_at: now,
      })),
    );
  }
}

async function persistScopeChanges(
  tx: ContactDatabaseTransaction,
  memberId: string,
  changes: AssignmentChanges,
  actor: WorkspaceActor,
  now: Date,
): Promise<void> {
  if (changes.removedScopes.length > 0) {
    await tx.delete(workspaceMemberScopedRoles).where(
      inArray(
        workspaceMemberScopedRoles.id,
        changes.removedScopes.map((row) => row.id),
      ),
    );
  }
  if (changes.addedScopes.length > 0) {
    await tx.insert(workspaceMemberScopedRoles).values(
      changes.addedScopes.map((assignment) => ({
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
  }
}

async function recordAssignmentChanges(
  tx: ContactDatabaseTransaction,
  memberId: string,
  changes: AssignmentChanges,
  actor: WorkspaceActor,
  now: Date,
): Promise<void> {
  if (changes.addedRoleIds.length > 0 || changes.removedRoleIds.length > 0) {
    await securityEventService.createSecurityEvent(tx, {
      type: SecurityEventType.WorkspaceMemberRolesChanged,
      actor: { type: ActorType.User, userId: actor.userId },
      subjectType: SecuritySubjectType.WorkspaceMember,
      subjectId: memberId,
      metadata: {
        addedRoleIds: changes.addedRoleIds,
        removedRoleIds: changes.removedRoleIds,
      },
      occurredAt: now,
    });
  }
  for (const assignment of changes.addedScopes) {
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
  }
  for (const row of changes.removedScopes) {
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
  }
}

async function replace(
  memberId: string,
  input: AssignmentInput,
  actor: WorkspaceActor,
) {
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const member = await workspaceMemberReadService.findById(tx, memberId);
    if (!member) {
      return {
        ok: false as const,
        code: WorkspaceMemberErrorCode.MemberNotFound,
      };
    }

    const currentRows = await loadCurrentScopes(tx, memberId);
    const result = await buildAssignmentChanges(tx, member, currentRows, input);
    if (!result.ok) return result;
    if (!hasAssignmentChanges(result.changes)) {
      return { ok: true as const, member };
    }

    const bump = await workspaceMemberVersionService.bump(
      tx,
      memberId,
      input.version,
    );
    if (!bump.ok) return bump;

    const now = new Date();
    await persistRoleChanges(tx, memberId, result.changes, actor, now);
    await persistScopeChanges(tx, memberId, result.changes, actor, now);
    await recordAssignmentChanges(tx, memberId, result.changes, actor, now);

    const refreshed = await workspaceMemberReadService.findById(tx, memberId);
    if (!refreshed) {
      throw new Error(
        "Workspace member is missing after role assignment replacement",
      );
    }
    return { ok: true as const, member: refreshed };
  });
}

export const memberRoleAssignmentService = {
  checkAssignable,
  replace,
} as const;
