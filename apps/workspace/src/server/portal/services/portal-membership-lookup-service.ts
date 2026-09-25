import "server-only";

import { and, asc, eq, exists, isNull, type SQL } from "drizzle-orm";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalMembershipOptionDto } from "@invessiv/common/contracts/portal/portal-membership-option.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customers,
  portalMembershipRoles,
  portalMemberships,
  rolePermissions,
  roles,
  users,
} from "@invessiv/db/record-configuration";
import { portalMembershipOptionMappingService } from "@/server/portal/services/portal-membership-option-mapping-service";

/** Reads run on the pooled client; no writer is needed for a company picker lookup. */
type PortalDatabaseExecutor = Pick<ContactDatabaseTransaction, "select">;

/**
 * A customer is offered only when the identity and membership are active and an active portal
 * role grants `portal.access`. The permission test is an `EXISTS` subquery so several roles that
 * grant the same permission cannot duplicate a company in the picker.
 */
async function listActiveCustomers(
  executor: PortalDatabaseExecutor,
  userCondition: SQL,
): Promise<PortalMembershipOptionDto[]> {
  const rows = await executor
    .select({
      customer_id: portalMemberships.customer_id,
      display_name: customers.display_name,
    })
    .from(portalMemberships)
    .innerJoin(users, eq(users.id, portalMemberships.user_id))
    .innerJoin(customers, eq(customers.id, portalMemberships.customer_id))
    .where(
      and(
        userCondition,
        eq(users.active, true),
        isNull(portalMemberships.revoked_at),
        exists(
          executor
            .select({
              membership_id: portalMembershipRoles.portal_membership_id,
            })
            .from(portalMembershipRoles)
            .innerJoin(
              roles,
              and(
                eq(roles.id, portalMembershipRoles.role_id),
                eq(roles.realm, AuthRealm.Portal),
                eq(roles.active, true),
              ),
            )
            .innerJoin(
              rolePermissions,
              and(
                eq(rolePermissions.role_id, roles.id),
                eq(rolePermissions.realm, AuthRealm.Portal),
                eq(rolePermissions.permission_key, Permission.PortalAccess),
              ),
            )
            .where(
              eq(
                portalMembershipRoles.portal_membership_id,
                portalMemberships.id,
              ),
            ),
        ),
      ),
    )
    .orderBy(asc(customers.display_name), asc(customers.id));

  return rows.map(portalMembershipOptionMappingService.mapMembershipRow);
}

async function listActiveCustomersForUser(
  executor: PortalDatabaseExecutor,
  clerkUserId: string,
): Promise<PortalMembershipOptionDto[]> {
  return listActiveCustomers(executor, eq(users.clerk_user_id, clerkUserId));
}

/**
 * Same permission-aware lookup, keyed on `users.id` instead of the Clerk id. Used wherever a
 * `PortalActor` or `WorkspaceActor` already resolved that id.
 */
async function listActiveCustomersForUserId(
  executor: PortalDatabaseExecutor,
  userId: string,
): Promise<PortalMembershipOptionDto[]> {
  return listActiveCustomers(executor, eq(users.id, userId));
}

export const portalMembershipLookupService = {
  listActiveCustomersForUser,
  listActiveCustomersForUserId,
} as const;
