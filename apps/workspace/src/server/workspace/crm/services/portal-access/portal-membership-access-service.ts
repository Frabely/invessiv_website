import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { portalMemberships } from "@invessiv/db/record-configuration";
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

export const portalMembershipAccessService = { loadAuthorizedActive } as const;
