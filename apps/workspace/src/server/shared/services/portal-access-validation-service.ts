import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  portalMemberships,
  rolePermissions,
  roles,
} from "@invessiv/db/record-configuration";
import { hasUsablePortalRoles } from "@/common/patterns/portal/has-usable-portal-roles";

async function areActivePortalRoles(
  tx: ContactDatabaseTransaction,
  roleIds: readonly string[],
): Promise<boolean> {
  if (roleIds.length === 0) return false;
  const available = await tx
    .select({ id: roles.id, permission: rolePermissions.permission_key })
    .from(roles)
    .leftJoin(rolePermissions, eq(rolePermissions.role_id, roles.id))
    .where(
      and(
        inArray(roles.id, [...roleIds]),
        eq(roles.realm, AuthRealm.Portal),
        eq(roles.active, true),
      ),
    );
  return hasUsablePortalRoles(roleIds, available);
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

export const portalAccessValidationService = {
  areActivePortalRoles,
  hasActiveMembership,
} as const;
