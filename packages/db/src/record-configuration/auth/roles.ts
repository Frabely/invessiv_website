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
import { RolesConstraintName } from "@invessiv/db/constraint-names/auth/roles-constraint-names";

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
    check(
      RolesConstraintName.RealmCheck,
      sqlCheckIn(table.realm, AUTH_REALM_VALUES),
    ),
    check(
      RolesConstraintName.SystemKeyCheck,
      sqlCheckIn(table.system_key, SYSTEM_ROLE_KEY_VALUES),
    ),
    check(
      RolesConstraintName.SystemKeyConsistencyCheck,
      sql`${table.is_system} = (${table.system_key} is not null)`,
    ),
    check(
      RolesConstraintName.NameCheck,
      sql`btrim
      (
      ${table.name}
      )
      <>
      ''`,
    ),
    check(
      RolesConstraintName.VersionCheck,
      sql`${table.version}
      > 0`,
    ),
    uniqueIndex(RolesConstraintName.SystemKeyUnique).on(table.system_key),
    uniqueIndex(RolesConstraintName.RealmNameUnique).on(
      table.realm,
      sql`lower(btrim(${table.name}))`,
    ),
    uniqueIndex(RolesConstraintName.IdRealmUnique).on(table.id, table.realm),
    uniqueIndex(RolesConstraintName.IdRealmIsSystemUnique).on(
      table.id,
      table.realm,
      table.is_system,
    ),
  ],
);
