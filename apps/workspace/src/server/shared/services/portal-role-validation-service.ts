import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { rolePermissions, roles } from "@invessiv/db/record-configuration";
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

export const portalRoleValidationService = { areActivePortalRoles } as const;
