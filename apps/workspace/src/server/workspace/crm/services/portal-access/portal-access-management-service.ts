import "server-only";

import { and, eq, inArray, isNull, type SQL } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customerContactAssignments,
  portalInvitationRoles,
  portalInvitations,
  portalMemberships,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";

async function loadAuthorizedActive(
  tx: ContactDatabaseTransaction,
  membershipId: string,
  actor: WorkspaceActor,
) {
  const [membership] = await tx
    .select()
    .from(portalMemberships)
    .where(
      and(
        eq(portalMemberships.id, membershipId),
        isNull(portalMemberships.revoked_at),
      ),
    )
    .limit(1)
    .for("update");

  return membership &&
    canOn(actor, Permission.PortalAccessManage, {
      customerId: membership.customer_id,
    })
    ? membership
    : null;
}

async function revokeOpenInvitations(
  tx: ContactDatabaseTransaction,
  assignmentCondition: SQL,
  now: Date,
): Promise<void> {
  await tx
    .update(portalInvitations)
    .set({ revoked_at: now, updated_at: now })
    .where(
      and(
        assignmentCondition,
        isNull(portalInvitations.redeemed_at),
        isNull(portalInvitations.revoked_at),
      ),
    );
}

async function revokeInvitationsForAssignment(
  tx: ContactDatabaseTransaction,
  assignmentId: string,
  now: Date,
): Promise<void> {
  await revokeOpenInvitations(
    tx,
    eq(portalInvitations.assignment_id, assignmentId),
    now,
  );
}

async function revokeInvitationsForCustomerPerson(
  tx: ContactDatabaseTransaction,
  customerId: string,
  personId: string,
  now: Date,
): Promise<void> {
  const assignments = tx
    .select({ id: customerContactAssignments.id })
    .from(customerContactAssignments)
    .where(
      and(
        eq(customerContactAssignments.customer_id, customerId),
        eq(customerContactAssignments.person_id, personId),
      ),
    );
  await revokeOpenInvitations(
    tx,
    inArray(portalInvitations.assignment_id, assignments),
    now,
  );
}

async function createInvitationWithRoles(
  tx: ContactDatabaseTransaction,
  input: {
    assignmentId: string;
    roleIds: string[];
    tokenHash: string;
    expiresAt: Date;
    emailNotificationsEnabled: boolean;
    createdByMemberId: string;
    now: Date;
  },
): Promise<string> {
  const invitationId = crypto.randomUUID();
  await tx.insert(portalInvitations).values({
    id: invitationId,
    assignment_id: input.assignmentId,
    token_hash: input.tokenHash,
    email_notifications_enabled: input.emailNotificationsEnabled,
    expires_at: input.expiresAt,
    redeemed_at: null,
    revoked_at: null,
    created_by_member_id: input.createdByMemberId,
    created_at: input.now,
    updated_at: input.now,
  });
  await tx.insert(portalInvitationRoles).values(
    input.roleIds.map((roleId) => ({
      portal_invitation_id: invitationId,
      role_id: roleId,
      role_realm: AuthRealm.Portal,
    })),
  );
  return invitationId;
}

export const portalAccessManagementService = {
  createInvitationWithRoles,
  loadAuthorizedActive,
  revokeInvitationsForAssignment,
  revokeInvitationsForCustomerPerson,
} as const;
