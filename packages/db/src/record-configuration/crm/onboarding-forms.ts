import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  ONBOARDING_FORM_STATUS_VALUES,
  ONBOARDING_SUBMITTED_STATUS_VALUES,
  OnboardingFormStatus,
} from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { OnboardingFormsConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-forms-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";
import { questionnaireTemplates } from "./questionnaire-templates";
import { portalMemberships } from "./portal-memberships";
import { projects } from "./projects";
import { workspaceMembers } from "./workspace-members";

/**
 * The one onboarding form of a project. `customer_id` is denormalized for portal filters and bound
 * to the project by the composite key. There is deliberately no "last edited" column: answer
 * autosaves would bump `version` on every keystroke; the latest answer row carries that instead.
 */
export const onboardingForms = pgTable(
  "onboarding_forms",
  {
    id: uuid("id").primaryKey(),
    customer_id: uuid("customer_id").notNull(),
    project_id: uuid("project_id").notNull(),
    source_template_id: uuid("source_template_id"),
    status: text("status", { enum: ONBOARDING_FORM_STATUS_VALUES }).notNull(),
    created_by_member_id: uuid("created_by_member_id").notNull(),
    released_at: timestamp("released_at", { withTimezone: true }),
    released_by_member_id: uuid("released_by_member_id"),
    submitted_at: timestamp("submitted_at", { withTimezone: true }),
    submitted_by_portal_membership_id: uuid(
      "submitted_by_portal_membership_id",
    ),
    services_confirmed_at: timestamp("services_confirmed_at", {
      withTimezone: true,
    }),
    services_confirmed_by_portal_membership_id: uuid(
      "services_confirmed_by_portal_membership_id",
    ),
    services_note: text("services_note"),
    call_held_on: date("call_held_on"),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    completed_by_member_id: uuid("completed_by_member_id"),
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
      name: N.ProjectCustomerForeignKey,
      columns: [t.project_id, t.customer_id],
      foreignColumns: [projects.id, projects.customer_id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.SourceTemplateForeignKey,
      columns: [t.source_template_id],
      foreignColumns: [questionnaireTemplates.id],
    }).onDelete("set null"),
    foreignKey({
      name: N.CreatedByForeignKey,
      columns: [t.created_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    foreignKey({
      name: N.ReleasedByForeignKey,
      columns: [t.released_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    foreignKey({
      name: N.SubmittedByForeignKey,
      columns: [t.submitted_by_portal_membership_id],
      foreignColumns: [portalMemberships.id],
    }).onDelete("set null"),
    foreignKey({
      name: N.ServicesConfirmedByForeignKey,
      columns: [t.services_confirmed_by_portal_membership_id],
      foreignColumns: [portalMemberships.id],
    }).onDelete("set null"),
    foreignKey({
      name: N.CompletedByForeignKey,
      columns: [t.completed_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    unique(N.ProjectUnique).on(t.project_id),
    unique(N.IdCustomerUnique).on(t.id, t.customer_id),
    unique(N.IdProjectUnique).on(t.id, t.project_id),
    check(N.StatusCheck, sqlCheckIn(t.status, ONBOARDING_FORM_STATUS_VALUES)),
    check(
      N.ServicesNoteCheck,
      sql`length(${t.services_note}) <= ${sqlLimit(QUESTIONNAIRE_LIMITS.noteMaxLength)}`,
    ),
    check(N.VersionCheck, sql`${t.version} > 0`),
    check(
      N.ReleasedCheck,
      sql`(${t.status} = ${OnboardingFormStatus.Draft}) = (${t.released_at} is null)`,
    ),
    check(
      N.ReleasedByCheck,
      sql`${t.released_at} is null or ${t.released_by_member_id} is not null`,
    ),
    check(
      N.SubmittedCheck,
      sql`not (${sqlCheckIn(t.status, ONBOARDING_SUBMITTED_STATUS_VALUES)}) or ${t.submitted_at} is not null`,
    ),
    check(
      N.CompletedCheck,
      sql`(${t.status} = ${OnboardingFormStatus.Completed}) = (${t.completed_at} is not null and ${t.completed_by_member_id} is not null and ${t.call_held_on} is not null)`,
    ),
    check(
      N.ServicesConfirmedCheck,
      sql`${t.services_confirmed_by_portal_membership_id} is null or ${t.services_confirmed_at} is not null`,
    ),
    index(N.CustomerIndex).on(t.customer_id, t.completed_at.desc()),
  ],
);
