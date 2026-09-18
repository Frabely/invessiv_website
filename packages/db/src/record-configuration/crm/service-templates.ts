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
import { SERVICE_TEMPLATE_STATUS_VALUES } from "@invessiv/common/constants/crm/service-template-statuses";
import { ServiceTemplatesConstraintName } from "@invessiv/db/constraint-names/crm/service-templates-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";

/**
 * Workspace-wide, versioned catalog of maintainable service offerings. A row here is never a
 * project assignment: `project_services` (Task 41) copies it as a full snapshot, so changing or
 * archiving a template never touches an already-assigned service.
 */
export const serviceTemplates = pgTable(
  "service_templates",
  {
    id: uuid("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price_cents: integer("price_cents").notNull(),
    pricing_mode: text("pricing_mode", {
      enum: SERVICE_PRICING_MODE_VALUES,
    }).notNull(),
    recurring_interval: text("recurring_interval", {
      enum: BILLING_INTERVAL_VALUES,
    }),
    status: text("status", { enum: SERVICE_TEMPLATE_STATUS_VALUES }).notNull(),
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
      ServiceTemplatesConstraintName.TitleCheck,
      sql`btrim(${table.title}) <> ''`,
    ),
    check(
      ServiceTemplatesConstraintName.PriceCentsCheck,
      sql`${table.price_cents} >= 0`,
    ),
    check(
      ServiceTemplatesConstraintName.PricingModeCheck,
      sqlCheckIn(table.pricing_mode, SERVICE_PRICING_MODE_VALUES),
    ),
    check(
      ServiceTemplatesConstraintName.RecurringIntervalCheck,
      sql`${table.recurring_interval} is null or ${sqlCheckIn(table.recurring_interval, BILLING_INTERVAL_VALUES)}`,
    ),
    check(
      ServiceTemplatesConstraintName.PricingModeIntervalConsistencyCheck,
      sql`(${table.pricing_mode} = ${ServicePricingMode.Recurring}) = (${table.recurring_interval} is not null)`,
    ),
    check(
      ServiceTemplatesConstraintName.StatusCheck,
      sqlCheckIn(table.status, SERVICE_TEMPLATE_STATUS_VALUES),
    ),
    check(
      ServiceTemplatesConstraintName.VersionCheck,
      sql`${table.version} > 0`,
    ),
    index(ServiceTemplatesConstraintName.StatusCreatedAtIndex).on(
      table.status,
      table.created_at.desc(),
    ),
  ],
);
