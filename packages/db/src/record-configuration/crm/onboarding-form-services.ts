import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { OnboardingFormServicesConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-form-services-constraint-names";
import { onboardingForms } from "./onboarding-forms";
import { projectLineItems } from "./project-line-items";

/**
 * Snapshot of the booked services, written once at completion. Until then the form shows the live
 * project line items; `project_line_item_id` is provenance only and survives as null.
 */
export const onboardingFormServices = pgTable(
  "onboarding_form_services",
  {
    id: uuid("id").primaryKey(),
    form_id: uuid("form_id").notNull(),
    project_line_item_id: uuid("project_line_item_id"),
    title: text("title").notNull(),
    description: text("description"),
    position: integer("position").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: N.FormForeignKey,
      columns: [t.form_id],
      foreignColumns: [onboardingForms.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.LineItemForeignKey,
      columns: [t.project_line_item_id],
      foreignColumns: [projectLineItems.id],
    }).onDelete("set null"),
    unique(N.PositionUnique).on(t.form_id, t.position),
    check(N.PositionCheck, sql`${t.position} >= 0`),
  ],
);
