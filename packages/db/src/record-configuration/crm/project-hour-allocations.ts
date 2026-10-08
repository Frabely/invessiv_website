import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { ProjectHourAllocationsConstraintName as N } from "@invessiv/db/constraint-names/crm/project-hour-allocations-constraint-names";
import { sqlLimit } from "@invessiv/db/core";
import { customers } from "./customers";
import { projects } from "./projects";
import { workspaceMembers } from "./workspace-members";

/**
 * Immutable ledger of hours moved between the customer's free stock and a project: a positive row
 * allocates, a negative row releases. That free hours suffice and that a release never exceeds the
 * unused part is checked by the write path under a lock on the customer row; the database cannot
 * express a rule that spans three tables.
 */
export const projectHourAllocations = pgTable(
  "project_hour_allocations",
  {
    id: uuid("id").primaryKey(),
    customer_id: uuid("customer_id").notNull(),
    project_id: uuid("project_id").notNull(),
    minutes: integer("minutes").notNull(),
    // Internal remark; an empty string means "no note".
    note: text("note").notNull(),
    idempotency_key: uuid("idempotency_key").notNull(),
    created_by_member_id: uuid("created_by_member_id").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: N.CustomerForeignKey,
      columns: [t.customer_id],
      foreignColumns: [customers.id],
    }).onDelete("cascade"),
    // The composite key keeps an allocation from pointing at another customer's project.
    foreignKey({
      name: N.ProjectCustomerForeignKey,
      columns: [t.project_id, t.customer_id],
      foreignColumns: [projects.id, projects.customer_id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.CreatedByMemberForeignKey,
      columns: [t.created_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    unique(N.IdempotencyKeyUnique).on(t.idempotency_key),
    check(
      N.MinutesCheck,
      sql`${t.minutes} <> 0 and ${t.minutes} % ${sqlLimit(HoursLimits.StepMinutes)} = 0 and abs(${t.minutes}) <= ${sqlLimit(HoursLimits.MaxLedgerMinutes)}`,
    ),
    check(
      N.NoteCheck,
      sql`length(${t.note}) <= ${sqlLimit(HoursLimits.NoteMaxLength)}`,
    ),
    index(N.CustomerCreatedIndex).on(t.customer_id, t.created_at.desc()),
    index(N.ProjectIndex).on(t.project_id),
  ],
);
