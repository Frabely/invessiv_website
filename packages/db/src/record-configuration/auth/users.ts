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

import { UsersConstraintName } from "@invessiv/db/constraint-names/auth/users-constraint-names";

/**
 * Canonical identity of every signed-in human. Clerk authenticates, this table plus
 * memberships and roles authorize. `primary_email` is master data only and never authorizes.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    clerk_user_id: text("clerk_user_id").notNull(),
    primary_email: text("primary_email").notNull(),
    first_name: text("first_name"),
    last_name: text("last_name"),
    display_name: text("display_name").notNull(),
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
      UsersConstraintName.ClerkUserIdCheck,
      sql`btrim(${table.clerk_user_id}) <> ''`,
    ),
    check(
      UsersConstraintName.PrimaryEmailCheck,
      sql`btrim(${table.primary_email}) <> ''`,
    ),
    check(
      UsersConstraintName.DisplayNameCheck,
      sql`btrim
          (
          ${table.display_name}
          )
          <>
          ''`,
    ),
    check(
      UsersConstraintName.VersionCheck,
      sql`${table.version}
      > 0`,
    ),
    uniqueIndex(UsersConstraintName.ClerkUserIdUnique).on(table.clerk_user_id),
  ],
);
