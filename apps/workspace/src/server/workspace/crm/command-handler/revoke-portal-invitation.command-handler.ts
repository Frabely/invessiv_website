import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customerContactAssignments,
  portalInvitations,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import { securityEventService } from "@/server/shared/services/security-event-service";

/** Revokes one still-open invitation. The customer id is looked up server-side before access is checked. */
export async function revokePortalInvitation(
  invitationId: string,
  actor: WorkspaceActor,
): Promise<boolean> {
  if (!isUuid(invitationId)) return false;
  const db = getDrizzleDatabaseClient();
  const now = new Date();
  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .select({ customerId: customerContactAssignments.customer_id })
      .from(portalInvitations)
      .innerJoin(
        customerContactAssignments,
        eq(customerContactAssignments.id, portalInvitations.assignment_id),
      )
      .where(eq(portalInvitations.id, invitationId))
      .limit(1);
    if (
      !invitation ||
      !canOn(actor, Permission.PortalAccessManage, {
        customerId: invitation.customerId,
      })
    )
      return false;
    const rows = await tx
      .update(portalInvitations)
      .set({ revoked_at: now, updated_at: now })
      .where(
        and(
          eq(portalInvitations.id, invitationId),
          isNull(portalInvitations.redeemed_at),
          isNull(portalInvitations.revoked_at),
        ),
      )
      .returning({ id: portalInvitations.id });
    if (!rows[0]) return false;
    await securityEventService.createSecurityEvent(tx, {
      type: SecurityEventType.PortalInvitationRevoked,
      actor: { type: ActorType.User, userId: actor.userId },
      subjectType: SecuritySubjectType.PortalInvitation,
      subjectId: invitationId,
      metadata: { customerId: invitation.customerId },
      occurredAt: now,
    });
    return true;
  });
}
