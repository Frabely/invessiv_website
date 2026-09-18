import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { AUTH_REALM_VALUES } from "@invessiv/common/constants/auth/auth-realms";
import { PermissionsConstraintName } from "@invessiv/db/constraint-names/auth/permissions-constraint-names";
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
    scope_assignable: boolean("scope_assignable"),
    description: text("description").notNull(),
  },
  (table) => [
    check(
      PermissionsConstraintName.RealmCheck,
      sqlCheckIn(table.realm, AUTH_REALM_VALUES),
    ),
    check(
      PermissionsConstraintName.DescriptionCheck,
      sql`btrim(${table.description}) <> ''`,
    ),
    uniqueIndex(PermissionsConstraintName.KeyRealmDelegableUnique).on(
      table.key,
      table.realm,
      table.delegable,
    ),
    uniqueIndex(PermissionsConstraintName.KeyRealmScopeAssignableUnique).on(
      table.key,
      table.realm,
      table.scope_assignable,
    ),
  ],
);
