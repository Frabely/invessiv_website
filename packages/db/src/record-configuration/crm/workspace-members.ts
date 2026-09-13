import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "@invessiv/db/record-configuration/auth/users";

/**
 * Internal membership only. Identity lives in `users`, rights come exclusively from
 * `workspace_member_roles`; the table carries neither an email nor a role column.
 */
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
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
      "workspace_members_version_check",
      sql`${table.version}
        > 0`,
    ),
    uniqueIndex("workspace_members_user_id_uidx").on(table.user_id),
  ],
);
