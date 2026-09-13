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
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { clerkDirectoryService } from "@/server/workspace/access/services/clerk-directory-service";
import { roleAssignmentService } from "@/server/workspace/access/services/role-assignment-service";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

const USERS_CLERK_USER_ID_UNIQUE_CONSTRAINT = "users_clerk_user_id_uidx";
const MEMBER_ROLE_FOREIGN_KEY_CONSTRAINT = "workspace_member_roles_role_fkey";
const USER_MASTER_DATA_CHECK_CONSTRAINTS = [
  "users_primary_email_check",
  "users_display_name_check",
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

  // Two owners added the same account at once; the unique index decided.
  if (
    violation.code === PostgresErrorCode.UniqueViolation &&
    violation.constraint === USERS_CLERK_USER_ID_UNIQUE_CONSTRAINT
  ) {
    return {
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkAccountAlreadyLinked,
    };
  }
  // A role vanished or changed realm between the assignability check and the insert.
  if (
    violation.code === PostgresErrorCode.ForeignKeyViolation &&
    violation.constraint === MEMBER_ROLE_FOREIGN_KEY_CONSTRAINT
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
        const assignability = await roleAssignmentService.checkAssignable(tx, {
          roleIds,
          currentRoleIds: [],
        });
        if (!assignability.ok) {
          return assignability;
        }

        const now = new Date();
        const userId = crypto.randomUUID();
        const memberId = crypto.randomUUID();

        await tx.insert(users).values({
          id: userId,
          clerk_user_id: profile.clerkUserId,
          primary_email: primaryEmail,
          first_name: profile.firstName,
          last_name: profile.lastName,
          display_name: profile.displayName,
          active: true,
          version: 1,
          created_at: now,
          updated_at: now,
        });

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
