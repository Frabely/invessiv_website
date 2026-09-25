import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  customerContactAssignments,
  portalInvitations,
  portalMemberships,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { portalMembershipAccessService } from "@/server/workspace/crm/services/portal-access/portal-membership-access-service";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

type MembershipRow = typeof portalMemberships.$inferSelect;

async function revokeOpenInvitations(
  tx: ContactDatabaseTransaction,
  membership: MembershipRow,
  now: Date,
): Promise<void> {
  const assignments = tx
    .select({ id: customerContactAssignments.id })
    .from(customerContactAssignments)
    .where(
      and(
        eq(customerContactAssignments.customer_id, membership.customer_id),
        eq(customerContactAssignments.person_id, membership.person_id),
      ),
    );
  await tx
    .update(portalInvitations)
    .set({ revoked_at: now, updated_at: now })
    .where(
      and(
        inArray(portalInvitations.assignment_id, assignments),
        isNull(portalInvitations.redeemed_at),
        isNull(portalInvitations.revoked_at),
      ),
    );
}

/** Access ends on the next request; the membership and role history remain stored. */
export async function revokePortalMembership(
  membershipId: string,
  actor: WorkspaceActor,
): Promise<boolean> {
  if (!isUuid(membershipId)) return false;
  const db = getDrizzleDatabaseClient();
  return db.transaction(async (tx) => {
    const membership = await portalMembershipAccessService.loadAuthorizedActive(
      tx,
      membershipId,
      actor,
    );
    if (!membership) return false;

    const now = new Date();
    const write = await updateVersioned({
      tx,
      table: portalMemberships,
      id: membership.id,
      expectedVersion: membership.version,
      patch: { revoked_at: now },
      toDto: (row) => row.id,
    });
    if (!write.ok) return false;
    await revokeOpenInvitations(tx, membership, now);
    await securityEventService.createSecurityEvent(tx, {
      type: SecurityEventType.PortalMembershipRevoked,
      actor: { type: ActorType.User, userId: actor.userId },
      subjectType: SecuritySubjectType.PortalMembership,
      subjectId: membership.id,
      metadata: { customerId: membership.customer_id },
      occurredAt: now,
    });
    return true;
  });
}
