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

import { WorkspaceMembersConstraintName } from "@invessiv/db/constraint-names/crm/workspace-members-constraint-names";
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
      WorkspaceMembersConstraintName.VersionCheck,
      sql`${table.version}
        > 0`,
    ),
    uniqueIndex(WorkspaceMembersConstraintName.UserIdUnique).on(table.user_id),
  ],
);
