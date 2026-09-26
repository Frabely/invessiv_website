import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  TASK_ACTION_SIDE_VALUES,
  TaskActionSide,
} from "@invessiv/common/constants/crm/task-action-sides";
import {
  OPEN_TASK_STATUS_VALUES,
  TASK_STATUS_VALUES,
  TaskStatus,
} from "@invessiv/common/constants/crm/task-statuses";
import { TasksConstraintName } from "@invessiv/db/constraint-names/crm/tasks-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { projects } from "./projects";
import { portalMemberships } from "./portal-memberships";
import { workspaceMembers } from "./workspace-members";

/**
 * A task belongs to exactly one project; its customer is derived from that project, so there is
 * no customer column. The assignee is always an internal member, even when the customer has to
 * act (`action_side = 'customer'`), so someone internal knows to follow up. Completion data is set
 * exactly while the status is `done`; a customer-side task is always visible to the customer.
 */
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey(),
    project_id: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: text("status", { enum: TASK_STATUS_VALUES }).notNull(),
    action_side: text("action_side", {
      enum: TASK_ACTION_SIDE_VALUES,
    }).notNull(),
    visible_to_customer: boolean("visible_to_customer").notNull(),
    assignee_member_id: uuid("assignee_member_id")
      .notNull()
      .references(() => workspaceMembers.id),
    due_on: date("due_on"),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    completed_by_member_id: uuid("completed_by_member_id").references(
      () => workspaceMembers.id,
    ),
    // Read alongside the task; no lookup by completing membership needs an index.
    completed_by_portal_membership_id: uuid(
      "completed_by_portal_membership_id",
    ),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: TasksConstraintName.CompletedByPortalMembershipForeignKey,
      columns: [t.completed_by_portal_membership_id],
      foreignColumns: [portalMemberships.id],
    }),
    check(
      TasksConstraintName.TitleCheck,
      sql`btrim
        (
        ${t.title}
        )
        <>
        ''`,
    ),
    check(
      TasksConstraintName.StatusCheck,
      sqlCheckIn(t.status, TASK_STATUS_VALUES),
    ),
    check(
      TasksConstraintName.ActionSideCheck,
      sqlCheckIn(t.action_side, TASK_ACTION_SIDE_VALUES),
    ),
    check(
      TasksConstraintName.CustomerActionVisibleCheck,
      sql`${t.action_side}
            <>
            ${TaskActionSide.Customer}
            or
            ${t.visible_to_customer}`,
    ),
    check(
      TasksConstraintName.CompletionConsistencyCheck,
      sql`(${t.status} = ${TaskStatus.Done})
            = (
            ${t.completed_at}
            IS
            NOT
            NULL
            AND
            num_nonnulls
            (
            ${t.completed_by_member_id}
            ,
            ${t.completed_by_portal_membership_id}
            )
            =
            1
            )`,
    ),
    check(
      TasksConstraintName.PortalCompletionCustomerSideCheck,
      sql`${t.completed_by_portal_membership_id}
          IS NULL OR
          ${t.action_side}
          =
          ${TaskActionSide.Customer}`,
    ),
    check(
      TasksConstraintName.VersionCheck,
      sql`${t.version}
        > 0`,
    ),
    index(TasksConstraintName.ProjectStatusDueIndex).on(
      t.project_id,
      t.status,
      t.due_on,
    ),
    index(TasksConstraintName.OpenAssigneeDueIndex)
      .on(t.assignee_member_id, t.due_on)
      .where(sqlCheckIn(t.status, OPEN_TASK_STATUS_VALUES)),
  ],
);
