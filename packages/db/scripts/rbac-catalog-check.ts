import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import { PERMISSION_VALUES } from "@invessiv/common/constants/auth/permissions";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SYSTEM_ROLE_KEY_VALUES } from "@invessiv/common/constants/auth/system-role-keys";
import type { ContactDatabase } from "@invessiv/db/core";
import {
  permissions,
  rolePermissions,
  roles,
} from "@invessiv/db/record-configuration";
import { eq } from "drizzle-orm";

/**
 * Read-only comparison of the permission catalog and the system roles between code and
 * database, in both directions. Safe for every target, including production.
 */
export async function findRbacCatalogMismatches(
  db: ContactDatabase,
): Promise<string[]> {
  const [permissionRows, systemRoleRows, rolePermissionRows] =
    await Promise.all([
      db
        .select({
          key: permissions.key,
          realm: permissions.realm,
          delegable: permissions.delegable,
          description: permissions.description,
        })
        .from(permissions),
      db
        .select({
          id: roles.id,
          realm: roles.realm,
          system_key: roles.system_key,
          name: roles.name,
          active: roles.active,
        })
        .from(roles)
        .where(eq(roles.is_system, true)),
      db
        .select({
          role_id: rolePermissions.role_id,
          permission_key: rolePermissions.permission_key,
        })
        .from(rolePermissions)
        .innerJoin(roles, eq(roles.id, rolePermissions.role_id))
        .where(eq(roles.is_system, true)),
    ]);

  const mismatches: string[] = [];
  const permissionsByKey = new Map(permissionRows.map((row) => [row.key, row]));

  for (const permission of PERMISSION_VALUES) {
    const row = permissionsByKey.get(permission);
    const definition = PERMISSION_DEFINITIONS[permission];
    if (!row) {
      mismatches.push(`permission missing in database: ${permission}`);
      continue;
    }
    if (
      row.realm !== definition.realm ||
      row.delegable !== definition.delegable ||
      row.description !== definition.description
    ) {
      mismatches.push(`permission differs from code: ${permission}`);
    }
  }

  const knownPermissions = new Set<string>(PERMISSION_VALUES);
  for (const row of permissionRows) {
    if (!knownPermissions.has(row.key)) {
      mismatches.push(`unknown permission in database: ${row.key}`);
    }
  }

  const rolesByKey = new Map(
    systemRoleRows.map((row) => [row.system_key, row]),
  );
  for (const systemKey of SYSTEM_ROLE_KEY_VALUES) {
    const definition = SYSTEM_ROLE_DEFINITIONS[systemKey];
    const row = rolesByKey.get(systemKey);
    if (!row) {
      mismatches.push(`system role missing in database: ${systemKey}`);
      continue;
    }
    if (
      row.id !== definition.id ||
      row.realm !== definition.realm ||
      row.name !== definition.name ||
      !row.active
    ) {
      mismatches.push(`system role differs from code: ${systemKey}`);
    }

    const actual = rolePermissionRows
      .filter((entry) => entry.role_id === row.id)
      .map((entry) => entry.permission_key)
      .sort();
    const expected = [...definition.permissions].sort();
    if (actual.join(",") !== expected.join(",")) {
      mismatches.push(`system role permissions differ from code: ${systemKey}`);
    }
  }

  const knownSystemKeys = new Set<string>(SYSTEM_ROLE_KEY_VALUES);
  for (const row of systemRoleRows) {
    if (row.system_key === null || !knownSystemKeys.has(row.system_key)) {
      mismatches.push(
        `unknown system role in database: ${row.system_key ?? "<null>"}`,
      );
    }
  }

  return mismatches;
}
