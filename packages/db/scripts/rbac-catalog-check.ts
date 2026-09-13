import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import { PERMISSION_VALUES } from "@invessiv/common/constants/auth/permissions";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SYSTEM_ROLE_KEY_VALUES } from "@invessiv/common/constants/auth/system-role-keys";
import type { getDatabaseClient } from "@invessiv/db/core";

type Sql = ReturnType<typeof getDatabaseClient>;

type PermissionRow = {
  key: string;
  realm: string;
  delegable: boolean;
  description: string;
};

type SystemRoleRow = {
  id: string;
  realm: string;
  system_key: string;
  name: string;
  active: boolean;
};

type RolePermissionRow = { role_id: string; permission_key: string };

/**
 * Read-only comparison of the permission catalog and the system roles between code and
 * database, in both directions. Safe for every target, including production.
 */
export async function findRbacCatalogMismatches(sql: Sql): Promise<string[]> {
  const [permissionRows, systemRoleRows, rolePermissionRows] =
    (await Promise.all([
      sql`SELECT key, realm, delegable, description FROM permissions`,
      sql`SELECT id, realm, system_key, name, active FROM roles WHERE is_system`,
      sql`
        SELECT rp.role_id, rp.permission_key
        FROM role_permissions AS rp
        JOIN roles AS r ON r.id = rp.role_id
        WHERE r.is_system
      `,
    ])) as [PermissionRow[], SystemRoleRow[], RolePermissionRow[]];

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
    if (!knownSystemKeys.has(row.system_key)) {
      mismatches.push(`unknown system role in database: ${row.system_key}`);
    }
  }

  return mismatches;
}
