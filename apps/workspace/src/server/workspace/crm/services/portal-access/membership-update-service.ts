import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ReplacePortalMembershipRolesRequestDto } from "@invessiv/common/contracts/crm/replace-portal-membership-roles-request.dto";
import type { UpdatePortalMembershipRequestDto } from "@invessiv/common/contracts/crm/update-portal-membership-request.dto";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import {
  portalMembershipRoles,
  portalMemberships,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { securityEventService } from "@/server/shared/services/security-event-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { portalAccessValidationService } from "@/server/shared/services/portal-access-validation-service";
import { portalAccessManagementService } from "@/server/workspace/crm/services/portal-access/portal-access-management-service";

type MembershipRow = typeof portalMemberships.$inferSelect;
type MembershipDto = {
  id: string;
  version: number;
  emailNotificationsEnabled: boolean;
};
type UpdateValidationError =
  | typeof PortalAccessErrorCode.InvalidRoles
  | typeof PortalAccessErrorCode.ValidationError;
type MembershipResult =
  | { ok: true; membership: MembershipDto }
  | {
      ok: false;
      code: typeof PortalAccessErrorCode.NotFound | UpdateValidationError;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: {
        code: typeof ConcurrencyErrorCode.VersionConflict;
        currentVersion: number;
        current: MembershipDto;
      };
    };

const toDto = (row: MembershipRow): MembershipDto => ({
  id: row.id,
  version: row.version,
  emailNotificationsEnabled: row.email_notifications_enabled,
});

function validateVersion(version: number): boolean {
  return Number.isInteger(version) && version >= 1;
}

async function runVersionedUpdate(
  membershipId: string,
  expectedVersion: number,
  actor: WorkspaceActor,
  patch: Partial<typeof portalMemberships.$inferInsert>,
  beforeWrite?: (
    tx: ContactDatabaseTransaction,
    membership: MembershipRow,
  ) => Promise<UpdateValidationError | null>,
  afterWrite?: (
    tx: ContactDatabaseTransaction,
    membership: MembershipRow,
  ) => Promise<void>,
): Promise<MembershipResult> {
  if (!isUuid(membershipId))
    return { ok: false, code: PortalAccessErrorCode.NotFound };

  const db = getDrizzleDatabaseClient();
  return db.transaction(async (tx): Promise<MembershipResult> => {
    const membership = await portalAccessManagementService.loadAuthorizedActive(
      tx,
      membershipId,
      actor,
    );
    if (!membership) return { ok: false, code: PortalAccessErrorCode.NotFound };
    const validationError = beforeWrite
      ? await beforeWrite(tx, membership)
      : null;
    if (validationError) return { ok: false, code: validationError };

    const result = await updateVersioned({
      tx,
      table: portalMemberships,
      id: membershipId,
      expectedVersion,
      patch,
      toDto,
    });
    if (!result.ok) {
      if (result.code === ConcurrencyErrorCode.VersionConflict) {
        return {
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          conflict: result.conflict,
        };
      }
      return { ok: false, code: PortalAccessErrorCode.NotFound };
    }

    if (afterWrite) await afterWrite(tx, membership);
    return { ok: true, membership: result.value };
  });
}

async function updateNotifications(
  membershipId: string,
  input: UpdatePortalMembershipRequestDto,
  actor: WorkspaceActor,
): Promise<MembershipResult> {
  if (
    !input ||
    !validateVersion(input.version) ||
    typeof input.emailNotificationsEnabled !== "boolean"
  ) {
    return { ok: false, code: PortalAccessErrorCode.ValidationError };
  }

  return runVersionedUpdate(membershipId, input.version, actor, {
    email_notifications_enabled: input.emailNotificationsEnabled,
  });
}

async function replaceRoles(
  membershipId: string,
  input: ReplacePortalMembershipRolesRequestDto,
  actor: WorkspaceActor,
): Promise<MembershipResult> {
  const { roleIds, version } = input ?? {};
  if (!validateVersion(version))
    return { ok: false, code: PortalAccessErrorCode.ValidationError };
  if (
    !Array.isArray(roleIds) ||
    roleIds.length === 0 ||
    roleIds.some((roleId) => !isUuid(roleId)) ||
    new Set(roleIds).size !== roleIds.length
  ) {
    return { ok: false, code: PortalAccessErrorCode.InvalidRoles };
  }

  return runVersionedUpdate(
    membershipId,
    version,
    actor,
    {},
    async (tx) =>
      (await portalAccessValidationService.areActivePortalRoles(tx, roleIds))
        ? null
        : PortalAccessErrorCode.InvalidRoles,
    (tx, membership) => replaceMembershipRoles(tx, membership, roleIds, actor),
  );
}

async function replaceMembershipRoles(
  tx: ContactDatabaseTransaction,
  membership: MembershipRow,
  roleIds: string[],
  actor: WorkspaceActor,
): Promise<void> {
  const now = new Date();
  const existing = await tx
    .select({ roleId: portalMembershipRoles.role_id })
    .from(portalMembershipRoles)
    .where(eq(portalMembershipRoles.portal_membership_id, membership.id));
  const existingRoleIds = new Set(existing.map(({ roleId }) => roleId));
  const nextRoleIds = new Set(roleIds);
  const removedRoleIds = [...existingRoleIds].filter(
    (id) => !nextRoleIds.has(id),
  );
  const addedRoleIds = roleIds.filter((id) => !existingRoleIds.has(id));

  if (removedRoleIds.length > 0) {
    await tx
      .delete(portalMembershipRoles)
      .where(
        and(
          eq(portalMembershipRoles.portal_membership_id, membership.id),
          inArray(portalMembershipRoles.role_id, removedRoleIds),
        ),
      );
  }
  if (addedRoleIds.length > 0) {
    await tx.insert(portalMembershipRoles).values(
      addedRoleIds.map((roleId) => ({
        portal_membership_id: membership.id,
        role_id: roleId,
        role_realm: AuthRealm.Portal,
        assigned_by_member_id: actor.workspaceMemberId,
        assigned_at: now,
      })),
    );
  }
  if (removedRoleIds.length === 0 && addedRoleIds.length === 0) return;
  await securityEventService.createSecurityEvent(tx, {
    type: SecurityEventType.PortalMembershipRolesReplaced,
    actor: { type: ActorType.User, userId: actor.userId },
    subjectType: SecuritySubjectType.PortalMembership,
    subjectId: membership.id,
    metadata: { customerId: membership.customer_id, roleIds },
    occurredAt: now,
  });
}

export const membershipUpdateService = {
  updateNotifications,
  replaceRoles,
} as const;
