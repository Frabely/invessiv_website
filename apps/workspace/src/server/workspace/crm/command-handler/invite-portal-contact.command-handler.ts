import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import type { InvitePortalContactRequestDto } from "@invessiv/common/contracts/crm/invite-portal-contact-request.dto";
import type { InvitePortalContactResult } from "@invessiv/common/contracts/crm/results/invite-portal-contact-result";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  customerContactAssignments,
  customers,
} from "@invessiv/db/record-configuration";
import { canOn } from "@/common/patterns/auth/can-on";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { securityEventService } from "@/server/shared/services/security-event-service";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import { portalAccessValidationService } from "@/server/shared/services/portal-access-validation-service";
import { portalAccessManagementService } from "@/server/workspace/crm/services/portal-access/portal-access-management-service";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
type Assignment = { id: string; personId: string };

function validInput(
  input: InvitePortalContactRequestDto | null,
): input is InvitePortalContactRequestDto {
  return (
    input !== null &&
    typeof input === "object" &&
    typeof input.assignmentId === "string" &&
    isUuid(input.assignmentId) &&
    Array.isArray(input.roleIds) &&
    input.roleIds.length > 0 &&
    input.roleIds.every(
      (roleId) => typeof roleId === "string" && isUuid(roleId),
    ) &&
    typeof input.emailNotificationsEnabled === "boolean"
  );
}

async function findCustomerAssignment(
  tx: ContactDatabaseTransaction,
  customerId: string,
  assignmentId: string,
): Promise<Assignment | null> {
  const [assignment] = await tx
    .select({
      id: customerContactAssignments.id,
      personId: customerContactAssignments.person_id,
    })
    .from(customerContactAssignments)
    .where(
      and(
        eq(customerContactAssignments.id, assignmentId),
        eq(customerContactAssignments.customer_id, customerId),
      ),
    )
    .limit(1);
  return assignment ?? null;
}

async function findPreviewConfirmation(
  tx: ContactDatabaseTransaction,
  customerId: string,
): Promise<{ confirmedAt: Date | null } | null> {
  const [customer] = await tx
    .select({ confirmedAt: customers.portal_preview_confirmed_at })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  return customer ?? null;
}

/** Creates an invitation without retaining the plaintext token beyond this response. */
export async function invitePortalContact(
  customerId: string,
  input: InvitePortalContactRequestDto,
  actor: WorkspaceActor,
  inviteUrlForToken: (token: string) => string,
): Promise<InvitePortalContactResult> {
  if (!isUuid(customerId) || !validInput(input)) {
    return { ok: false, code: PortalAccessErrorCode.ValidationError };
  }
  if (!canOn(actor, Permission.PortalAccessManage, { customerId })) {
    return { ok: false, code: PortalAccessErrorCode.CustomerNotFound };
  }

  const db = getDrizzleDatabaseClient();
  const now = new Date();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);

  return db.transaction(async (tx): Promise<InvitePortalContactResult> => {
    const assignment = await findCustomerAssignment(
      tx,
      customerId,
      input.assignmentId,
    );
    if (!assignment) {
      return { ok: false, code: PortalAccessErrorCode.AssignmentNotFound };
    }

    const customer = await findPreviewConfirmation(tx, customerId);
    if (!customer) {
      return { ok: false, code: PortalAccessErrorCode.CustomerNotFound };
    }
    if (!customer.confirmedAt) {
      return { ok: false, code: PortalAccessErrorCode.PreviewNotConfirmed };
    }

    if (
      await portalAccessValidationService.hasActiveMembership(
        tx,
        customerId,
        assignment.personId,
      )
    ) {
      return { ok: false, code: PortalAccessErrorCode.MembershipAlreadyActive };
    }

    const selectedRoleIds = [...new Set(input.roleIds)];
    if (
      !(await portalAccessValidationService.areActivePortalRoles(
        tx,
        selectedRoleIds,
      ))
    ) {
      return { ok: false, code: PortalAccessErrorCode.InvalidPortalRole };
    }

    // A re-invite invalidates the old link before the new invitation is inserted.
    await portalAccessManagementService.revokeInvitationsForAssignment(
      tx,
      assignment.id,
      now,
    );
    const invitationId =
      await portalAccessManagementService.createInvitationWithRoles(tx, {
        assignmentId: assignment.id,
        roleIds: selectedRoleIds,
        tokenHash,
        expiresAt,
        emailNotificationsEnabled: input.emailNotificationsEnabled,
        createdByMemberId: actor.workspaceMemberId,
        now,
      });
    await securityEventService.createSecurityEvent(tx, {
      type: SecurityEventType.PortalInvitationCreated,
      actor: { type: ActorType.User, userId: actor.userId },
      subjectType: SecuritySubjectType.PortalInvitation,
      subjectId: invitationId,
      metadata: { customerId, assignmentId: assignment.id },
      occurredAt: now,
    });
    return {
      ok: true,
      invitation: { id: invitationId, expiresAt },
      inviteUrl: inviteUrlForToken(token),
    };
  });
}
