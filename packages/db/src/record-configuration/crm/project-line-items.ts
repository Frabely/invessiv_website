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

import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import {
  LINE_ITEM_KIND_VALUES,
  LineItemKind,
} from "@invessiv/common/constants/crm/line-item-kinds";
import { BILLING_INTERVAL_VALUES } from "@invessiv/common/constants/crm/billing-intervals";
import {
  SERVICE_PRICING_MODE_VALUES,
  ServicePricingMode,
} from "@invessiv/common/constants/crm/service-pricing-modes";
import { ProjectLineItemsConstraintName } from "@invessiv/db/constraint-names/crm/project-line-items-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { PROJECT_LINE_ITEM_STATUS_VALUES } from "@invessiv/common/constants/crm/project-line-item-statuses";
import { projects } from "./projects";
import { lineItemTemplates } from "./line-item-templates";

/**
 * A service belongs to exactly one project; its customer is derived from that project, so there
 * is no customer column and no customer-wide position. Title, description, price, pricing mode
 * and interval are a full snapshot — `source_line_item_template_id` is provenance only, which is
 * why it is nullable and set to null instead of cascading when a template disappears.
 *
 * `kind` is the snapshot of the template's kind (NULL on rows written before Task 74 reads as
 * standard). `quantity_minutes` exists exactly for purchased hours.
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
    status: text("status", { enum: PROJECT_LINE_ITEM_STATUS_VALUES }),
    kind: text("kind", { enum: LINE_ITEM_KIND_VALUES }),
    quantity_minutes: integer("quantity_minutes"),
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
    check(
      ProjectLineItemsConstraintName.StatusCheck,
      sqlCheckIn(table.status, PROJECT_LINE_ITEM_STATUS_VALUES),
    ),
    check(
      ProjectLineItemsConstraintName.KindCheck,
      sql`${table.kind} is null or ${sqlCheckIn(table.kind, LINE_ITEM_KIND_VALUES)}`,
    ),
    check(
      ProjectLineItemsConstraintName.QuantityMinutesCheck,
      sql`${table.quantity_minutes} is null or (${table.quantity_minutes} > 0 and ${table.quantity_minutes} % ${sql.raw(String(HoursLimits.StepMinutes))} = 0 and ${table.quantity_minutes} <= ${sql.raw(String(HoursLimits.MaxLedgerMinutes))})`,
    ),
    // IS NOT DISTINCT FROM keeps a NULL kind on the "not hours" side instead of passing as NULL.
    check(
      ProjectLineItemsConstraintName.KindQuantityCheck,
      sql`(${table.quantity_minutes} is not null) = (${table.kind} is not distinct from ${LineItemKind.Hours})`,
    ),
    index(ProjectLineItemsConstraintName.ProjectCreatedAtIndex).on(
      table.project_id,
      table.created_at.desc(),
    ),
  ],
);
