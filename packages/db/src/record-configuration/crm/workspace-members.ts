import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { WORKSPACE_ROLE_VALUES } from "@invessiv/common/constants/crm/workspace-roles";
import { sqlCheckIn } from "@invessiv/db/core";

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey(),
    clerk_user_id: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    role: text("role", { enum: WORKSPACE_ROLE_VALUES }).notNull(),
    active: boolean("active").notNull(),
    credentials_access: boolean("credentials_access").notNull(),
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
      "workspace_members_email_check",
      sql`btrim
        (
        ${table.email}
        )
        <>
        ''`,
    ),
    check(
      "workspace_members_role_check",
      sqlCheckIn(table.role, WORKSPACE_ROLE_VALUES),
    ),
    check(
      "workspace_members_version_check",
      sql`${table.version}
        > 0`,
    ),
    uniqueIndex("workspace_members_clerk_user_id_uidx").on(table.clerk_user_id),
    uniqueIndex("workspace_members_email_lower_uidx").on(
      sql`lower(btrim(
            ${table.email}
            )
            )`,
    ),
    index("workspace_members_active_role_idx")
      .on(table.role)
      .where(sql`${table.active}`),
  ],
);
