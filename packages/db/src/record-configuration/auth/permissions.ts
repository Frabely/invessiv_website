import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { AUTH_REALM_VALUES } from "@invessiv/common/constants/auth/auth-realms";
import { sqlCheckIn } from "@invessiv/db/core";

/**
 * Database mirror of `PERMISSION_DEFINITIONS`. Rows change only through migrations; the
 * composite unique index is the target that lets `role_permissions` enforce realm and
 * delegability in the database instead of in TypeScript alone.
 */
export const permissions = pgTable(
  "permissions",
  {
    key: text("key").primaryKey(),
    realm: text("realm", { enum: AUTH_REALM_VALUES }).notNull(),
    delegable: boolean("delegable").notNull(),
    description: text("description").notNull(),
  },
  (table) => [
    check(
      "permissions_realm_check",
      sqlCheckIn(table.realm, AUTH_REALM_VALUES),
    ),
    check(
      "permissions_description_check",
      sql`btrim(${table.description}) <> ''`,
    ),
    uniqueIndex("permissions_key_realm_delegable_uidx").on(
      table.key,
      table.realm,
      table.delegable,
    ),
  ],
);
