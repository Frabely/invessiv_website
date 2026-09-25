import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { AddWorkspaceMemberRequestDto } from "@invessiv/common/contracts/auth/add-workspace-member-request.dto";
import type { AddWorkspaceMemberResult } from "@invessiv/common/contracts/auth/results/add-workspace-member-result";
import { getDrizzleDatabaseClient, PostgresErrorCode } from "@invessiv/db/core";
import {
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { UsersConstraintName } from "@invessiv/db/constraint-names/auth/users-constraint-names";
import { WorkspaceMemberRolesConstraintName } from "@invessiv/db/constraint-names/auth/workspace-member-roles-constraint-names";
import { WorkspaceMembersConstraintName } from "@invessiv/db/constraint-names/crm/workspace-members-constraint-names";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { clerkDirectoryService } from "@/server/workspace/access/services/clerk-directory-service";
import { memberRoleAssignmentService } from "@/server/workspace/access/services/member-role-assignment-service";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";
import { securityEventService } from "@/server/shared/services/security-event-service";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";
import { clerkUserService } from "@/server/shared/services/clerk-user-service";

const USER_MASTER_DATA_CHECK_CONSTRAINTS: readonly string[] = [
  UsersConstraintName.PrimaryEmailCheck,
  UsersConstraintName.DisplayNameCheck,
];

/**
 * Maps database violations with a known cause to an answer the owner can act on. Anything else
 * is unexpected and propagates, so the route logs it and answers 500.
 */
function mapKnownViolation(error: unknown): AddWorkspaceMemberResult | null {
  const violation = postgresErrorService.findViolation(error);
  if (!violation) {
    return null;
  }

  // Two owners added the same account at once — either as a brand-new `users` row, or as the
  // second `workspace_members` row for a reused, already-locked one; either way, the account is
  // now a member.
  if (
    violation.code === PostgresErrorCode.UniqueViolation &&
    (violation.constraint === UsersConstraintName.ClerkUserIdUnique ||
      violation.constraint === WorkspaceMembersConstraintName.UserIdUnique)
  ) {
    return {
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkAccountAlreadyLinked,
    };
  }
  // A role vanished or changed realm between the assignability check and the insert.
  if (
    violation.code === PostgresErrorCode.ForeignKeyViolation &&
    violation.constraint === WorkspaceMemberRolesConstraintName.RoleForeignKey
  ) {
    return { ok: false, code: WorkspaceMemberErrorCode.RoleNotAssignable };
  }
  // Clerk delivered master data the users table rejects, e.g. a blank address.
  if (
    violation.code === PostgresErrorCode.CheckViolation &&
    violation.constraint !== undefined &&
    USER_MASTER_DATA_CHECK_CONSTRAINTS.includes(violation.constraint)
  ) {
    return {
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkAccountIncomplete,
    };
  }

  return null;
}

export async function addWorkspaceMember(
  input: AddWorkspaceMemberRequestDto,
  actor: WorkspaceActor,
): Promise<AddWorkspaceMemberResult> {
  const validation = accessSchemas.addWorkspaceMember.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: WorkspaceMemberErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const { clerkUserId, roleIds } = validation.data;
  if (roleIds.length === 0) {
    return { ok: false, code: WorkspaceMemberErrorCode.MemberWithoutRole };
  }

  // Master data comes from Clerk itself, never from the request.
  const lookup = await clerkDirectoryService.findProfile(clerkUserId);
  if (!lookup.ok) {
    return lookup;
  }
  const { profile } = lookup;
  const primaryEmail = profile.primaryEmail;
  if (!primaryEmail) {
    return {
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkAccountIncomplete,
    };
  }

  const db = getDrizzleDatabaseClient();

  try {
    return await db.transaction(
      async (tx): Promise<AddWorkspaceMemberResult> => {
        const assignability = await memberRoleAssignmentService.checkAssignable(
          tx,
          {
            roleIds,
            currentRoleIds: [],
          },
        );
        if (!assignability.ok) {
          return assignability;
        }

        const now = new Date();
        const memberId = crypto.randomUUID();

        // A portal-only account (12b) may already hold this identity's `users` row; adding it as
        // a workspace member reuses and reactivates that row instead of duplicating it. Locking
        // and master-data sync are shared with the portal-invitation flow so both stay consistent.
        const user = await clerkUserService.ensureUser(
          tx,
          {
            clerkUserId: profile.clerkUserId,
            primaryEmail,
            firstName: profile.firstName,
            lastName: profile.lastName,
            displayName: profile.displayName,
          },
          now,
          { activate: true },
        );
        const userId = user.id;

        await tx.insert(workspaceMembers).values({
          id: memberId,
          user_id: userId,
          active: true,
          version: 1,
          created_at: now,
          updated_at: now,
        });

        await tx.insert(workspaceMemberRoles).values(
          roleIds.map((roleId) => ({
            workspace_member_id: memberId,
            role_id: roleId,
            role_realm: AuthRealm.Workspace,
            assigned_by_user_id: actor.userId,
            assigned_at: now,
          })),
        );

        await securityEventService.createSecurityEvent(tx, {
          type: SecurityEventType.WorkspaceMemberAdded,
          actor: { type: ActorType.User, userId: actor.userId },
          subjectType: SecuritySubjectType.WorkspaceMember,
          subjectId: memberId,
          metadata: { roleIds },
          occurredAt: now,
        });

        const member = await workspaceMemberReadService.findById(tx, memberId);
        if (!member) {
          throw new Error(
            "Workspace member is missing inside its creating transaction",
          );
        }

        return { ok: true, member };
      },
    );
  } catch (error: unknown) {
    const known = mapKnownViolation(error);
    if (known) {
      return known;
    }
    throw error;
  }
}
