import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { PROJECT_BILLING_MODEL_VALUES } from "@invessiv/common/constants/crm/project-billing-models";
import { PROJECT_PHASE_SEQUENCE } from "@invessiv/common/constants/crm/project-phases";
import { PROJECT_STATUS_VALUES } from "@invessiv/common/constants/crm/project-statuses";
import { PROJECT_WORKFLOW_KEY_VALUES } from "@invessiv/common/constants/crm/project-workflows";
import { ProjectsConstraintName } from "@invessiv/db/constraint-names/crm/projects-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { customers } from "./customers";
import { workspaceMembers } from "./workspace-members";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey(),
    customer_id: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    owner_member_id: uuid("owner_member_id")
      .notNull()
      .references(() => workspaceMembers.id),
    title: text("title").notNull(),
    status: text("status", { enum: PROJECT_STATUS_VALUES }).notNull(),
    phase: text("phase", { enum: PROJECT_PHASE_SEQUENCE }).notNull(),
    process_steps: text("process_steps").array().notNull(),
    current_process_step: text("current_process_step").notNull(),
    workflow_key: text("workflow_key", {
      enum: PROJECT_WORKFLOW_KEY_VALUES,
    }).notNull(),
    billing_model: text("billing_model", {
      enum: PROJECT_BILLING_MODEL_VALUES,
    }).notNull(),
    included_feedback_rounds: integer("included_feedback_rounds").notNull(),
    preview_url: text("preview_url"),
    next_step_label: text("next_step_label"),
    next_step_due_on: date("next_step_due_on"),
    started_on: date("started_on"),
    budget_cents: integer("budget_cents"),
    hourly_rate_cents: integer("hourly_rate_cents"),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      ProjectsConstraintName.TitleCheck,
      sql`btrim
            (
            ${t.title}
            )
            <>
            ''`,
    ),
    check(
      ProjectsConstraintName.StatusCheck,
      sqlCheckIn(t.status, PROJECT_STATUS_VALUES),
    ),
    check(
      ProjectsConstraintName.PhaseCheck,
      sqlCheckIn(t.phase, PROJECT_PHASE_SEQUENCE),
    ),
    check(
      ProjectsConstraintName.WorkflowCheck,
      sqlCheckIn(t.workflow_key, PROJECT_WORKFLOW_KEY_VALUES),
    ),
    check(
      ProjectsConstraintName.BillingModelCheck,
      sqlCheckIn(t.billing_model, PROJECT_BILLING_MODEL_VALUES),
    ),
    check(
      ProjectsConstraintName.FeedbackRoundsCheck,
      sql`${t.included_feedback_rounds}
            between 1 and 20`,
    ),
    check(
      ProjectsConstraintName.BudgetCheck,
      sql`${t.budget_cents}
            is null or
            ${t.budget_cents}
            >=
            0`,
    ),
    check(
      ProjectsConstraintName.HourlyRateCheck,
      sql`${t.hourly_rate_cents}
            is null or
            ${t.hourly_rate_cents}
            >=
            0`,
    ),
    check(
      ProjectsConstraintName.VersionCheck,
      sql`${t.version}
            > 0`,
    ),
    check(
      ProjectsConstraintName.ProcessStepsCheck,
      sql`cardinality
            (
            ${t.process_steps}
            )
            >
            0
            and
            ${t.current_process_step}
            =
            any
            (
            ${t.process_steps}
            )`,
    ),
    uniqueIndex(ProjectsConstraintName.IdCustomerUnique).on(
      t.id,
      t.customer_id,
    ),
    index(ProjectsConstraintName.CustomerCreatedAtIndex).on(
      t.customer_id,
      t.created_at.desc(),
    ),
    index(ProjectsConstraintName.OpenOwnerIndex).on(t.owner_member_id),
  ],
);
