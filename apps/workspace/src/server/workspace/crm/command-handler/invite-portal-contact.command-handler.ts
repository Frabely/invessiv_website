import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
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
  portalInvitationRoles,
  portalInvitations,
  portalMemberships,
} from "@invessiv/db/record-configuration";
import { canOn } from "@/common/patterns/auth/can-on";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import { portalRoleValidationService } from "@/server/workspace/crm/services/portal-access/portal-role-validation-service";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
type Assignment = { id: string; personId: string };
type CreateInvitationArgs = {
  tx: ContactDatabaseTransaction;
  input: InvitePortalContactRequestDto;
  assignmentId: string;
  roleIds: string[];
  tokenHash: string;
  expiresAt: Date;
  actor: WorkspaceActor;
  now: Date;
};

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

async function hasActiveMembership(
  tx: ContactDatabaseTransaction,
  customerId: string,
  personId: string,
): Promise<boolean> {
  const [membership] = await tx
    .select({ id: portalMemberships.id })
    .from(portalMemberships)
    .where(
      and(
        eq(portalMemberships.customer_id, customerId),
        eq(portalMemberships.person_id, personId),
        isNull(portalMemberships.revoked_at),
      ),
    )
    .limit(1);
  return membership !== undefined;
}

async function revokeOpenInvitationForAssignment(
  tx: ContactDatabaseTransaction,
  assignmentId: string,
  now: Date,
): Promise<void> {
  // A re-invite invalidates the old link before the new invitation is inserted.
  await tx
    .update(portalInvitations)
    .set({ revoked_at: now, updated_at: now })
    .where(
      and(
        eq(portalInvitations.assignment_id, assignmentId),
        isNull(portalInvitations.redeemed_at),
        isNull(portalInvitations.revoked_at),
      ),
    );
}

async function createInvitationWithRoles({
  tx,
  input,
  assignmentId,
  roleIds,
  tokenHash,
  expiresAt,
  actor,
  now,
}: CreateInvitationArgs): Promise<string> {
  const invitationId = crypto.randomUUID();
  await tx.insert(portalInvitations).values({
    id: invitationId,
    assignment_id: assignmentId,
    token_hash: tokenHash,
    email_notifications_enabled: input.emailNotificationsEnabled,
    expires_at: expiresAt,
    redeemed_at: null,
    revoked_at: null,
    created_by_member_id: actor.workspaceMemberId,
    created_at: now,
    updated_at: now,
  });
  await tx.insert(portalInvitationRoles).values(
    roleIds.map((roleId) => ({
      portal_invitation_id: invitationId,
      role_id: roleId,
      role_realm: AuthRealm.Portal,
    })),
  );
  return invitationId;
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

    if (await hasActiveMembership(tx, customerId, assignment.personId)) {
      return { ok: false, code: PortalAccessErrorCode.MembershipAlreadyActive };
    }

    const selectedRoleIds = [...new Set(input.roleIds)];
    if (
      !(await portalRoleValidationService.areActivePortalRoles(
        tx,
        selectedRoleIds,
      ))
    ) {
      return { ok: false, code: PortalAccessErrorCode.InvalidPortalRole };
    }

    await revokeOpenInvitationForAssignment(tx, assignment.id, now);
    const invitationId = await createInvitationWithRoles({
      tx,
      input,
      assignmentId: assignment.id,
      roleIds: selectedRoleIds,
      tokenHash,
      expiresAt,
      actor,
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
