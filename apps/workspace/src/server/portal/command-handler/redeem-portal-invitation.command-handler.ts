import "server-only";

import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { PortalInvitationErrorCode } from "@invessiv/common/constants/portal/portal-invitation-error-codes";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  customerContactAssignments,
  portalInvitationRoles,
  portalInvitations,
  portalMembershipRoles,
  portalMemberships,
} from "@invessiv/db/record-configuration";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";
import { portalInvitationState } from "@/common/patterns/portal/portal-invitation-state";
import { portalAccessValidationService } from "@/server/shared/services/portal-access-validation-service";
import { clerkUserService } from "@/server/shared/services/clerk-user-service";

type RedeemPortalInvitationResult =
  | { ok: true; customerId: string }
  | { ok: false; code: PortalInvitationErrorCode };

type ClerkUser = {
  id: string;
  primaryEmail: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
};

type OpenInvitation = {
  id: string;
  assignmentId: string;
  emailNotificationsEnabled: boolean;
  createdByMemberId: string;
  expiresAt: Date;
  redeemedAt: Date | null;
  revokedAt: Date | null;
};

type InvitationAssignment = { customerId: string; personId: string };

async function findInvitation(
  tx: ContactDatabaseTransaction,
  tokenHash: string,
): Promise<OpenInvitation | null> {
  const [invitation] = await tx
    .select({
      id: portalInvitations.id,
      assignmentId: portalInvitations.assignment_id,
      emailNotificationsEnabled: portalInvitations.email_notifications_enabled,
      createdByMemberId: portalInvitations.created_by_member_id,
      expiresAt: portalInvitations.expires_at,
      redeemedAt: portalInvitations.redeemed_at,
      revokedAt: portalInvitations.revoked_at,
    })
    .from(portalInvitations)
    .where(eq(portalInvitations.token_hash, tokenHash))
    .limit(1)
    .for("update");
  return invitation ?? null;
}

async function findInvitationAssignment(
  tx: ContactDatabaseTransaction,
  assignmentId: string,
): Promise<InvitationAssignment | null> {
  const [assignment] = await tx
    .select({
      customerId: customerContactAssignments.customer_id,
      personId: customerContactAssignments.person_id,
    })
    .from(customerContactAssignments)
    .where(eq(customerContactAssignments.id, assignmentId))
    .limit(1);
  return assignment ?? null;
}

async function resolveOrCreatePortalUser(
  tx: ContactDatabaseTransaction,
  clerkUser: ClerkUser & { primaryEmail: string },
  now: Date,
): Promise<string | null> {
  // Shared with the workspace-member flow so both lock and sync the identity's `users` row the
  // same way; unlike that flow, redemption never reactivates a deactivated account.
  const user = await clerkUserService.ensureUser(
    tx,
    {
      clerkUserId: clerkUser.id,
      primaryEmail: clerkUser.primaryEmail,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      displayName: clerkUser.displayName,
    },
    now,
  );
  return user.active ? user.id : null;
}

async function createPortalMembership(
  tx: ContactDatabaseTransaction,
  invitation: OpenInvitation,
  assignment: InvitationAssignment,
  userId: string,
  now: Date,
  roleIds: readonly string[],
): Promise<string> {
  const membershipId = crypto.randomUUID();
  await tx.insert(portalMemberships).values({
    id: membershipId,
    customer_id: assignment.customerId,
    person_id: assignment.personId,
    user_id: userId,
    activated_at: now,
    revoked_at: null,
    last_seen_at: null,
    email_notifications_enabled: invitation.emailNotificationsEnabled,
    customer_notified_at: null,
    version: 1,
    created_at: now,
    updated_at: now,
  });

  await tx.insert(portalMembershipRoles).values(
    roleIds.map((roleId) => ({
      portal_membership_id: membershipId,
      role_id: roleId,
      role_realm: AuthRealm.Portal,
      // The invitation creator is the accountable assigner for its transferred role set.
      assigned_by_member_id: invitation.createdByMemberId,
      assigned_at: now,
    })),
  );
  return membershipId;
}

/** Atomically consumes an invitation and creates the independent portal membership. */
export async function redeemPortalInvitation(
  token: string,
  clerkUser: ClerkUser,
): Promise<RedeemPortalInvitationResult> {
  const primaryEmail = clerkUser.primaryEmail;
  if (!token || !primaryEmail) {
    return { ok: false, code: PortalInvitationErrorCode.Invalid };
  }
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const db = getDrizzleDatabaseClient();
  const now = new Date();

  return db.transaction(async (tx): Promise<RedeemPortalInvitationResult> => {
    const invitation = await findInvitation(tx, tokenHash);
    const stateError = portalInvitationState(invitation, now);
    if (stateError || !invitation)
      return {
        ok: false,
        code: stateError ?? PortalInvitationErrorCode.Invalid,
      };

    const assignment = await findInvitationAssignment(
      tx,
      invitation.assignmentId,
    );
    if (!assignment)
      return { ok: false, code: PortalInvitationErrorCode.Invalid };
    if (
      await portalAccessValidationService.hasActiveMembership(
        tx,
        assignment.customerId,
        assignment.personId,
      )
    )
      return { ok: false, code: PortalInvitationErrorCode.Invalid };

    const roleRows = await tx
      .select({ roleId: portalInvitationRoles.role_id })
      .from(portalInvitationRoles)
      .where(eq(portalInvitationRoles.portal_invitation_id, invitation.id));
    const roleIds = roleRows.map((row) => row.roleId);
    if (
      !(await portalAccessValidationService.areActivePortalRoles(tx, roleIds))
    )
      return { ok: false, code: PortalInvitationErrorCode.Invalid };

    const userId = await resolveOrCreatePortalUser(
      tx,
      { ...clerkUser, primaryEmail },
      now,
    );
    if (!userId) return { ok: false, code: PortalInvitationErrorCode.Invalid };

    const membershipId = await createPortalMembership(
      tx,
      invitation,
      assignment,
      userId,
      now,
      roleIds,
    );
    await tx
      .update(portalInvitations)
      .set({ redeemed_at: now, updated_at: now })
      .where(eq(portalInvitations.id, invitation.id));
    await securityEventService.createSecurityEvent(tx, {
      type: SecurityEventType.PortalInvitationRedeemed,
      actor: { type: ActorType.User, userId },
      subjectType: SecuritySubjectType.PortalInvitation,
      subjectId: invitation.id,
      metadata: { membershipId, customerId: assignment.customerId },
      occurredAt: now,
    });
    return { ok: true, customerId: assignment.customerId };
  });
}
