import "server-only";

import { eq } from "drizzle-orm";
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
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { portalAccessValidationService } from "@/server/shared/services/portal-access-validation-service";
import { portalAccessManagementService } from "@/server/workspace/crm/services/portal-access/portal-access-management-service";

type MembershipRow = typeof portalMemberships.$inferSelect;
type MembershipUpdateInput =
  UpdatePortalMembershipRequestDto | ReplacePortalMembershipRolesRequestDto;
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

function isRoleReplacement(
  input: MembershipUpdateInput,
): input is ReplacePortalMembershipRolesRequestDto {
  return "roleIds" in input;
}

function validateUpdateInput(
  input: MembershipUpdateInput,
): UpdateValidationError | null {
  if (
    !input ||
    typeof input !== "object" ||
    !Number.isInteger(input.version) ||
    input.version < 1
  ) {
    return PortalAccessErrorCode.ValidationError;
  }
  if (!isRoleReplacement(input)) {
    return typeof input.emailNotificationsEnabled === "boolean"
      ? null
      : PortalAccessErrorCode.ValidationError;
  }
  const { roleIds } = input;
  if (
    !Array.isArray(roleIds) ||
    roleIds.length === 0 ||
    roleIds.some((roleId) => !isUuid(roleId)) ||
    new Set(roleIds).size !== roleIds.length
  ) {
    return PortalAccessErrorCode.InvalidRoles;
  }
  return null;
}

async function replaceMembershipRoles(
  tx: ContactDatabaseTransaction,
  membership: MembershipRow,
  roleIds: string[],
  actor: WorkspaceActor,
): Promise<void> {
  const now = new Date();
  await tx
    .delete(portalMembershipRoles)
    .where(eq(portalMembershipRoles.portal_membership_id, membership.id));
  await tx.insert(portalMembershipRoles).values(
    roleIds.map((roleId) => ({
      portal_membership_id: membership.id,
      role_id: roleId,
      role_realm: AuthRealm.Portal,
      assigned_by_member_id: actor.workspaceMemberId,
      assigned_at: now,
    })),
  );
  await securityEventService.createSecurityEvent(tx, {
    type: SecurityEventType.PortalMembershipRolesReplaced,
    actor: { type: ActorType.User, userId: actor.userId },
    subjectType: SecuritySubjectType.PortalMembership,
    subjectId: membership.id,
    metadata: { customerId: membership.customer_id, roleIds },
    occurredAt: now,
  });
}

export async function updatePortalMembership(
  membershipId: string,
  input: MembershipUpdateInput,
  actor: WorkspaceActor,
): Promise<MembershipResult> {
  if (!isUuid(membershipId))
    return { ok: false, code: PortalAccessErrorCode.NotFound };
  const validationError = validateUpdateInput(input);
  if (validationError) return { ok: false, code: validationError };

  const db = getDrizzleDatabaseClient();
  return db.transaction(async (tx): Promise<MembershipResult> => {
    const membership = await portalAccessManagementService.loadAuthorizedActive(
      tx,
      membershipId,
      actor,
    );
    if (!membership) return { ok: false, code: PortalAccessErrorCode.NotFound };

    if (
      isRoleReplacement(input) &&
      !(await portalAccessValidationService.areActivePortalRoles(
        tx,
        input.roleIds,
      ))
    ) {
      return { ok: false, code: PortalAccessErrorCode.InvalidRoles };
    }

    const result = await updateVersioned({
      tx,
      table: portalMemberships,
      id: membershipId,
      expectedVersion: input.version,
      patch: isRoleReplacement(input)
        ? {}
        : { email_notifications_enabled: input.emailNotificationsEnabled },
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

    if (isRoleReplacement(input))
      await replaceMembershipRoles(tx, membership, input.roleIds, actor);
    return { ok: true, membership: result.value };
  });
}
