import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { WORKSPACE_REALM_VALUES } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberScopedRolesConstraintName } from "@invessiv/db/constraint-names/auth/workspace-member-scoped-roles-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import {
  customers,
  projects,
  workspaceMembers,
} from "@invessiv/db/record-configuration/crm";
import { roles } from "./roles";
import { users } from "./users";

export const workspaceMemberScopedRoles = pgTable(
  "workspace_member_scoped_roles",
  {
    id: uuid("id").primaryKey(),
    workspace_member_id: uuid("workspace_member_id")
      .notNull()
      .references(() => workspaceMembers.id, { onDelete: "restrict" }),
    role_id: uuid("role_id").notNull(),
    role_realm: text("role_realm", { enum: WORKSPACE_REALM_VALUES }).notNull(),
    role_scope_assignable: boolean("role_scope_assignable").notNull(),
    customer_id: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    project_id: uuid("project_id"),
    assigned_by_user_id: uuid("assigned_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assigned_at: timestamp("assigned_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      WorkspaceMemberScopedRolesConstraintName.RealmCheck,
      sqlCheckIn(table.role_realm, WORKSPACE_REALM_VALUES),
    ),
    check(
      WorkspaceMemberScopedRolesConstraintName.ScopeAssignableCheck,
      sql`${table.role_scope_assignable}`,
    ),
    foreignKey({
      name: WorkspaceMemberScopedRolesConstraintName.RoleForeignKey,
      columns: [table.role_id, table.role_realm, table.role_scope_assignable],
      foreignColumns: [roles.id, roles.realm, roles.scope_assignable],
    }).onDelete("restrict"),
    foreignKey({
      name: WorkspaceMemberScopedRolesConstraintName.ProjectCustomerForeignKey,
      columns: [table.project_id, table.customer_id],
      foreignColumns: [projects.id, projects.customer_id],
    }).onDelete("restrict"),
    uniqueIndex(WorkspaceMemberScopedRolesConstraintName.CustomerUnique).on(
      table.workspace_member_id,
      table.role_id,
      table.customer_id,
    ).where(sql`${table.project_id}
            is null`),
    uniqueIndex(WorkspaceMemberScopedRolesConstraintName.ProjectUnique).on(
      table.workspace_member_id,
      table.role_id,
      table.project_id,
    ).where(sql`${table.project_id}
            is not null`),
    index(WorkspaceMemberScopedRolesConstraintName.CustomerIndex).on(
      table.customer_id,
    ),
    index(WorkspaceMemberScopedRolesConstraintName.ProjectIndex).on(
      table.project_id,
    ).where(sql`${table.project_id}
            is not null`),
    index(WorkspaceMemberScopedRolesConstraintName.RoleIndex).on(table.role_id),
  ],
);
