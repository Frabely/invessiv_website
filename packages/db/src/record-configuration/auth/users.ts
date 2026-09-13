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
      "users_clerk_user_id_check",
      sql`btrim(${table.clerk_user_id}) <> ''`,
    ),
    check(
      "users_primary_email_check",
      sql`btrim(${table.primary_email}) <> ''`,
    ),
    check("users_display_name_check", sql`btrim(${table.display_name}) <> ''`),
    check("users_version_check", sql`${table.version} > 0`),
    uniqueIndex("users_clerk_user_id_uidx").on(table.clerk_user_id),
  ],
);
