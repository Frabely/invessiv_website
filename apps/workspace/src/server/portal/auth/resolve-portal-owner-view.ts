import "server-only";

import { eq } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { PORTAL_READ_PERMISSION_VALUES } from "@invessiv/common/constants/auth/permission-definitions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers } from "@invessiv/db/record-configuration";
import { securityEventService } from "@/server/shared/services/security-event-service";
import { workspaceOwnerLookupService } from "@/server/shared/services/workspace-owner-lookup-service";

import {
  createPortalOwnerView,
  type PortalOwnerView,
} from "./portal-owner-view";

/**
 * Opens a customer's portal for the workspace owner, read-only. Archived customers stay readable so
 * the owner can check them. The security event is written in the same transaction before the view
 * exists: no audit entry, no view. Throws on database errors; the gates translate that into a
 * closed door.
 */
export async function resolvePortalOwnerView(
  clerkUserId: string,
  customerId: string,
): Promise<PortalOwnerView | null> {
  const db = getDrizzleDatabaseClient();

  return db.transaction(async (tx) => {
    const ownerUserId = await workspaceOwnerLookupService.findActiveOwnerUserId(
      tx,
      clerkUserId,
    );
    if (!ownerUserId) return null;

    const customerRows = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);
    if (customerRows.length === 0) return null;

    await securityEventService.createSecurityEvent(tx, {
      type: SecurityEventType.PortalOwnerViewOpened,
      actor: { type: ActorType.User, userId: ownerUserId },
      subjectType: SecuritySubjectType.Customer,
      subjectId: customerId,
      metadata: null,
      occurredAt: new Date(),
    });

    return createPortalOwnerView({
      userId: ownerUserId,
      customerId,
      permissions: new Set(PORTAL_READ_PERMISSION_VALUES),
    });
  });
}
