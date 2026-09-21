import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { BILLING_INTERVAL_VALUES } from "@invessiv/common/constants/crm/billing-intervals";
import {
  SERVICE_PRICING_MODE_VALUES,
  ServicePricingMode,
} from "@invessiv/common/constants/crm/service-pricing-modes";
import { ProjectLineItemsConstraintName } from "@invessiv/db/constraint-names/crm/project-line-items-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { projects } from "./projects";
import { lineItemTemplates } from "./line-item-templates";

/**
 * A service belongs to exactly one project; its customer is derived from that project, so there
 * is no customer column and no customer-wide position. Title, description, price, pricing mode
 * and interval are a full snapshot — `source_line_item_template_id` is provenance only, which is
 * why it is nullable and set to null instead of cascading when a template disappears.
 */
export const projectLineItems = pgTable(
  "project_line_items",
  {
    id: uuid("id").primaryKey(),
    project_id: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    source_line_item_template_id: uuid(
      "source_line_item_template_id",
    ).references(() => lineItemTemplates.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price_cents: integer("price_cents").notNull(),
    pricing_mode: text("pricing_mode", {
      enum: SERVICE_PRICING_MODE_VALUES,
    }).notNull(),
    recurring_interval: text("recurring_interval", {
      enum: BILLING_INTERVAL_VALUES,
    }),
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
      ProjectLineItemsConstraintName.TitleCheck,
      sql`btrim(${table.title}) <> ''`,
    ),
    check(
      ProjectLineItemsConstraintName.PriceCentsCheck,
      sql`${table.price_cents} >= 0`,
    ),
    check(
      ProjectLineItemsConstraintName.PricingModeCheck,
      sqlCheckIn(table.pricing_mode, SERVICE_PRICING_MODE_VALUES),
    ),
    check(
      ProjectLineItemsConstraintName.RecurringIntervalCheck,
      sql`${table.recurring_interval} is null or ${sqlCheckIn(table.recurring_interval, BILLING_INTERVAL_VALUES)}`,
    ),
    check(
      ProjectLineItemsConstraintName.PricingModeIntervalConsistencyCheck,
      sql`(${table.pricing_mode} = ${ServicePricingMode.Recurring}) = (${table.recurring_interval} is not null)`,
    ),
    check(
      ProjectLineItemsConstraintName.VersionCheck,
      sql`${table.version} > 0`,
    ),
    index(ProjectLineItemsConstraintName.ProjectCreatedAtIndex).on(
      table.project_id,
      table.created_at.desc(),
    ),
  ],
);
