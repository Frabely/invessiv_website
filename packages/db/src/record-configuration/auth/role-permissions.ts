import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { AUTH_REALM_VALUES } from "@invessiv/common/constants/auth/auth-realms";
import { sqlCheckIn } from "@invessiv/db/core";
import { permissions } from "@invessiv/db/record-configuration/auth/permissions";
import { roles } from "@invessiv/db/record-configuration/auth/roles";

/**
 * `realm` is shared by both composite foreign keys, so a role can only hold permissions of
 * its own realm. `role_is_system` and `permission_delegable` are copied through the keys, which
 * lets a plain CHECK keep non-delegable permissions out of custom roles — even for raw SQL.
 */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    role_id: uuid("role_id").notNull(),
    realm: text("realm", { enum: AUTH_REALM_VALUES }).notNull(),
    role_is_system: boolean("role_is_system").notNull(),
    permission_key: text("permission_key").notNull(),
    permission_delegable: boolean("permission_delegable").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "role_permissions_pkey",
      columns: [table.role_id, table.permission_key],
    }),
    foreignKey({
      name: "role_permissions_role_fkey",
      columns: [table.role_id, table.realm, table.role_is_system],
      foreignColumns: [roles.id, roles.realm, roles.is_system],
    }).onDelete("cascade"),
    foreignKey({
      name: "role_permissions_permission_fkey",
      columns: [table.permission_key, table.realm, table.permission_delegable],
      foreignColumns: [
        permissions.key,
        permissions.realm,
        permissions.delegable,
      ],
    }).onUpdate("cascade"),
    check(
      "role_permissions_realm_check",
      sqlCheckIn(table.realm, AUTH_REALM_VALUES),
    ),
    check(
      "role_permissions_delegation_check",
      sql`${table.role_is_system} or ${table.permission_delegable}`,
    ),
    index("role_permissions_permission_key_idx").on(table.permission_key),
  ],
);
