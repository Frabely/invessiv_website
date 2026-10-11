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

import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { ProjectTimeEntriesConstraintName as N } from "@invessiv/db/constraint-names/crm/project-time-entries-constraint-names";
import { sqlLimit } from "@invessiv/db/core";
import { customers } from "./customers";
import { projects } from "./projects";
import { tasks } from "./tasks";
import { workspaceMembers } from "./workspace-members";

/**
 * Time booked on exactly one project, optionally naming a task of that same project. Unlike
 * `tasks` the row carries its customer: the per-customer sums are the most frequent query, and the
 * composite project key makes an entry on a foreign project impossible. A non-billable entry is
 * shown to the customer but counted against nothing.
 */
export const projectTimeEntries = pgTable(
  "project_time_entries",
  {
    id: uuid("id").primaryKey(),
    customer_id: uuid("customer_id").notNull(),
    project_id: uuid("project_id").notNull(),
    task_id: uuid("task_id"),
    performed_on: date("performed_on").notNull(),
    duration_minutes: integer("duration_minutes").notNull(),
    // Customer-visible: this is the line the customer reads in the portal.
    description: text("description").notNull(),
    billable: boolean("billable").notNull(),
    performed_by_member_id: uuid("performed_by_member_id").notNull(),
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
      name: N.CustomerForeignKey,
      columns: [t.customer_id],
      foreignColumns: [customers.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.ProjectCustomerForeignKey,
      columns: [t.project_id, t.customer_id],
      foreignColumns: [projects.id, projects.customer_id],
    }).onDelete("cascade"),
    // No cascade: tasks only vanish with their project, which removes the entry through its own
    // project key. SET NULL on a composite key would clear project_id as well.
    foreignKey({
      name: N.TaskProjectForeignKey,
      columns: [t.task_id, t.project_id],
      foreignColumns: [tasks.id, tasks.project_id],
    }),
    foreignKey({
      name: N.PerformedByMemberForeignKey,
      columns: [t.performed_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    check(
      N.DurationCheck,
      sql`${t.duration_minutes} > 0 and ${t.duration_minutes} % ${sqlLimit(HoursLimits.StepMinutes)} = 0 and ${t.duration_minutes} <= ${sqlLimit(HoursLimits.MaxEntryMinutes)}`,
    ),
    check(
      N.DescriptionCheck,
      sql`btrim(${t.description}) <> '' and length(${t.description}) <= ${sqlLimit(HoursLimits.DescriptionMaxLength)}`,
    ),
    check(N.VersionCheck, sql`${t.version} > 0`),
    index(N.ProjectPerformedIndex).on(
      t.project_id,
      t.performed_on.desc(),
      t.created_at.desc(),
    ),
    index(N.CustomerPerformedIndex).on(
      t.customer_id,
      t.performed_on.desc(),
      t.created_at.desc(),
    ),
    index(N.TaskIndex)
      .on(t.task_id)
      .where(sql`${t.task_id} is not null`),
  ],
);
