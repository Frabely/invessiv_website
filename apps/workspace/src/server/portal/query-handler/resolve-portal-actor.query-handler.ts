import "server-only";

import { and, asc, eq, isNull, lt, or } from "drizzle-orm";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  portalMembershipRoles,
  portalMemberships,
  rolePermissions,
  roles,
  users,
} from "@invessiv/db/record-configuration";
import type { ResolvePortalActorResult } from "@/server/portal/auth/resolve-portal-actor-types";
import { portalActorMappingService } from "@/server/portal/auth/services/portal-actor-mapping-service";

/**
 * Loads identity and, scoped to exactly this customer, the membership and its portal
 * permissions. The customer id narrows the join itself, not a filter applied afterwards — a
 * membership for a different customer never appears in the rows at all.
 * Throws on database errors; the gates translate that into a closed door.
 */
export async function resolvePortalActor(
  clerkUserId: string,
  customerId: string,
): Promise<ResolvePortalActorResult> {
  const db = getDrizzleDatabaseClient();

  const rows = await db
    .select({
      user_id: users.id,
      user_active: users.active,
      membership_id: portalMemberships.id,
      person_id: portalMemberships.person_id,
      revoked_at: portalMemberships.revoked_at,
      permission_key: rolePermissions.permission_key,
    })
    .from(users)
    .leftJoin(
      portalMemberships,
      and(
        eq(portalMemberships.user_id, users.id),
        eq(portalMemberships.customer_id, customerId),
        isNull(portalMemberships.revoked_at),
      ),
    )
    .leftJoin(
      portalMembershipRoles,
      eq(portalMembershipRoles.portal_membership_id, portalMemberships.id),
    )
    .leftJoin(
      roles,
      and(
        eq(roles.id, portalMembershipRoles.role_id),
        eq(roles.realm, AuthRealm.Portal),
        eq(roles.active, true),
      ),
    )
    .leftJoin(
      rolePermissions,
      and(
        eq(rolePermissions.role_id, roles.id),
        eq(rolePermissions.realm, AuthRealm.Portal),
      ),
    )
    .where(eq(users.clerk_user_id, clerkUserId))
    // A user can hold two active memberships for the same customer via two different contact
    // assignments. The ID resolves equal activation timestamps consistently.
    .orderBy(asc(portalMemberships.activated_at), asc(portalMemberships.id));

  const resolution = portalActorMappingService.mapRowsToResolution(
    rows,
    customerId,
  );
  if (resolution.ok) {
    const refreshBefore = new Date(Date.now() - 15 * 60 * 1000);
    await db
      .update(portalMemberships)
      .set({ last_seen_at: new Date(), updated_at: new Date() })
      .where(
        and(
          eq(portalMemberships.id, resolution.actor.membershipId),
          isNull(portalMemberships.revoked_at),
          or(
            isNull(portalMemberships.last_seen_at),
            lt(portalMemberships.last_seen_at, refreshBefore),
          ),
        ),
      );
  }

  return resolution;
}
