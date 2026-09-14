import "server-only";

import { eq, sql } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { BootstrapWorkspaceOwnerError } from "@/common/constants/auth/bootstrap-workspace-owner-errors";
import type {
  BootstrapWorkspaceOwnerInput,
  BootstrapWorkspaceOwnerResult,
} from "@/server/workspace/auth/bootstrap-workspace-owner-types";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";
import { workspaceBootstrapIdentityService } from "@/server/workspace/auth/services/workspace-bootstrap-identity-service";
import { workspaceOwnerInvariantService } from "@/server/workspace/auth/services/workspace-owner-invariant-service";

const BOOTSTRAP_LOCK_NAME = "workspace_owner_bootstrap";

/**
 * Creates the first owner atomically. The advisory lock serializes parallel first requests, so
 * exactly one user, membership and owner assignment can come out of it.
 */
export async function bootstrapWorkspaceOwner(
  input: BootstrapWorkspaceOwnerInput,
): Promise<BootstrapWorkspaceOwnerResult> {
  if (!workspaceBootstrapIdentityService.matches(input.clerkUserId)) {
    return {
      ok: false,
      code: BootstrapWorkspaceOwnerError.IdentityMismatch,
    };
  }

  const db = getDrizzleDatabaseClient();

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${BOOTSTRAP_LOCK_NAME}))`,
    );

    const existingUser = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerk_user_id, input.clerkUserId))
      .limit(1);

    if (existingUser.length > 0) {
      return {
        ok: false,
        code: BootstrapWorkspaceOwnerError.AlreadyInitialized,
      };
    }

    const activeOwnerMemberIds =
      await workspaceOwnerInvariantService.findActiveOwnerMemberIds(tx);

    if (activeOwnerMemberIds.length > 0) {
      return {
        ok: false,
        code: BootstrapWorkspaceOwnerError.AlreadyInitialized,
      };
    }

    const now = new Date();
    const userId = crypto.randomUUID();
    const workspaceMemberId = crypto.randomUUID();

    await tx.insert(users).values({
      id: userId,
      clerk_user_id: input.clerkUserId,
      primary_email: input.primaryEmail,
      first_name: input.firstName,
      last_name: input.lastName,
      display_name: input.displayName,
      active: true,
      version: 1,
      created_at: now,
      updated_at: now,
    });

    await tx.insert(workspaceMembers).values({
      id: workspaceMemberId,
      user_id: userId,
      active: true,
      version: 1,
      created_at: now,
      updated_at: now,
    });

    await tx.insert(workspaceMemberRoles).values({
      workspace_member_id: workspaceMemberId,
      role_id: SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.WorkspaceOwner].id,
      role_realm: AuthRealm.Workspace,
      assigned_by_user_id: userId,
      assigned_at: now,
    });

    await securityEventService.createSecurityEvent(tx, {
      type: SecurityEventType.WorkspaceOwnerBootstrapped,
      actor: { type: ActorType.User, userId },
      subjectType: SecuritySubjectType.WorkspaceMember,
      subjectId: workspaceMemberId,
      occurredAt: now,
    });

    return { ok: true, userId, workspaceMemberId };
  });
}
