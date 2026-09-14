import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { AUTH_REALM_VALUES } from "@invessiv/common/constants/auth/auth-realms";
import { SYSTEM_ROLE_KEY_VALUES } from "@invessiv/common/constants/auth/system-role-keys";
import { sqlCheckIn } from "@invessiv/db/core";
import { AuthConstraintName } from "@invessiv/db/record-configuration/auth/auth-constraint-names";

/**
 * A role is configuration: a named bundle of permissions. No feature ever checks a role.
 * `(id, realm)` and `(id, realm, is_system)` exist only as composite foreign key targets.
 */
export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey(),
    realm: text("realm", { enum: AUTH_REALM_VALUES }).notNull(),
    system_key: text("system_key", { enum: SYSTEM_ROLE_KEY_VALUES }),
    name: text("name").notNull(),
    description: text("description"),
    is_system: boolean("is_system").notNull(),
    active: boolean("active").notNull(),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("roles_realm_check", sqlCheckIn(table.realm, AUTH_REALM_VALUES)),
    check(
      "roles_system_key_check",
      sqlCheckIn(table.system_key, SYSTEM_ROLE_KEY_VALUES),
    ),
    check(
      "roles_system_key_consistency_check",
      sql`${table.is_system} = (${table.system_key} is not null)`,
    ),
    check("roles_name_check", sql`btrim(${table.name}) <> ''`),
    check("roles_version_check", sql`${table.version} > 0`),
    uniqueIndex("roles_system_key_uidx").on(table.system_key),
    uniqueIndex(AuthConstraintName.RolesRealmNameUnique).on(
      table.realm,
      sql`lower(btrim(${table.name}))`,
    ),
    uniqueIndex("roles_id_realm_uidx").on(table.id, table.realm),
    uniqueIndex("roles_id_realm_is_system_uidx").on(
      table.id,
      table.realm,
      table.is_system,
    ),
  ],
);
