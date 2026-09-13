import {
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { WORKSPACE_REALM_VALUES } from "@invessiv/common/constants/auth/auth-realms";
import { sqlCheckIn } from "@invessiv/db/core";
import { roles } from "@invessiv/db/record-configuration/auth/roles";
import { users } from "@invessiv/db/record-configuration/auth/users";
import { workspaceMembers } from "@invessiv/db/record-configuration/crm/workspace-members";

/**
 * `role_realm` is pinned to `workspace` and part of the foreign key, so a portal role can
 * never be assigned to an internal member.
 */
export const workspaceMemberRoles = pgTable(
  "workspace_member_roles",
  {
    workspace_member_id: uuid("workspace_member_id")
      .notNull()
      .references(() => workspaceMembers.id, { onDelete: "restrict" }),
    role_id: uuid("role_id").notNull(),
    role_realm: text("role_realm", { enum: WORKSPACE_REALM_VALUES }).notNull(),
    assigned_by_user_id: uuid("assigned_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assigned_at: timestamp("assigned_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "workspace_member_roles_pkey",
      columns: [table.workspace_member_id, table.role_id],
    }),
    foreignKey({
      name: "workspace_member_roles_role_fkey",
      columns: [table.role_id, table.role_realm],
      foreignColumns: [roles.id, roles.realm],
    }).onDelete("restrict"),
    check(
      "workspace_member_roles_role_realm_check",
      sqlCheckIn(table.role_realm, WORKSPACE_REALM_VALUES),
    ),
    index("workspace_member_roles_role_id_idx").on(table.role_id),
  ],
);
