import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  LINE_ITEM_KIND_VALUES,
  LineItemKind,
} from "@invessiv/common/constants/crm/line-item-kinds";
import {
  LINE_ITEM_PROJECT_MODE_VALUES,
  LineItemProjectMode,
} from "@invessiv/common/constants/crm/line-item-project-modes";
import { LineItemTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/line-item-template-field-limits";
import { BILLING_INTERVAL_VALUES } from "@invessiv/common/constants/crm/billing-intervals";
import {
  SERVICE_PRICING_MODE_VALUES,
  ServicePricingMode,
} from "@invessiv/common/constants/crm/service-pricing-modes";
import { LINE_ITEM_TEMPLATE_STATUS_VALUES } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { LineItemTemplatesConstraintName } from "@invessiv/db/constraint-names/crm/line-item-templates-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";

/**
 * Workspace-wide, versioned catalog of maintainable service offerings. A row here is never a
 * project assignment: `project_line_items` (Task 41) copies it as a full snapshot, so changing or
 * archiving a template never touches an already-assigned service.
 *
 * `kind`, `project_mode`, `portal_requestable` and `portal_description` are nullable because rows
 * written before Task 74 lack them; NULL reads as standard, existing project and not released.
 */
export const lineItemTemplates = pgTable(
  "line_item_templates",
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
    status: text("status", {
      enum: LINE_ITEM_TEMPLATE_STATUS_VALUES,
    }).notNull(),
    kind: text("kind", { enum: LINE_ITEM_KIND_VALUES }),
    project_mode: text("project_mode", {
      enum: LINE_ITEM_PROJECT_MODE_VALUES,
    }),
    portal_requestable: boolean("portal_requestable"),
    portal_description: text("portal_description"),
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
      LineItemTemplatesConstraintName.TitleCheck,
      sql`btrim(${table.title}) <> ''`,
    ),
    check(
      LineItemTemplatesConstraintName.PriceCentsCheck,
      sql`${table.price_cents} >= 0`,
    ),
    check(
      LineItemTemplatesConstraintName.PricingModeCheck,
      sqlCheckIn(table.pricing_mode, SERVICE_PRICING_MODE_VALUES),
    ),
    check(
      LineItemTemplatesConstraintName.RecurringIntervalCheck,
      sql`${table.recurring_interval} is null or ${sqlCheckIn(table.recurring_interval, BILLING_INTERVAL_VALUES)}`,
    ),
    check(
      LineItemTemplatesConstraintName.PricingModeIntervalConsistencyCheck,
      sql`(${table.pricing_mode} = ${ServicePricingMode.Recurring}) = (${table.recurring_interval} is not null)`,
    ),
    check(
      LineItemTemplatesConstraintName.StatusCheck,
      sqlCheckIn(table.status, LINE_ITEM_TEMPLATE_STATUS_VALUES),
    ),
    check(
      LineItemTemplatesConstraintName.VersionCheck,
      sql`${table.version} > 0`,
    ),
    check(
      LineItemTemplatesConstraintName.KindCheck,
      sql`${table.kind} is null or ${sqlCheckIn(table.kind, LINE_ITEM_KIND_VALUES)}`,
    ),
    check(
      LineItemTemplatesConstraintName.ProjectModeCheck,
      sql`${table.project_mode} is null or ${sqlCheckIn(table.project_mode, LINE_ITEM_PROJECT_MODE_VALUES)}`,
    ),
    check(
      LineItemTemplatesConstraintName.KindPricingModeCheck,
      sql`(${table.kind} is distinct from ${LineItemKind.Hours} or ${table.pricing_mode} = ${ServicePricingMode.Rate}) and (${table.kind} is distinct from ${LineItemKind.FeedbackRound} or ${table.pricing_mode} = ${ServicePricingMode.OneTime})`,
    ),
    check(
      LineItemTemplatesConstraintName.KindProjectModeCheck,
      sql`${table.kind} is null or ${table.kind} = ${LineItemKind.Standard} or ${table.project_mode} is distinct from ${LineItemProjectMode.NewProject}`,
    ),
    check(
      LineItemTemplatesConstraintName.PortalDescriptionCheck,
      sql`(${table.portal_description} is null or length(${table.portal_description}) <= ${sql.raw(String(LineItemTemplateFieldLimits.PortalDescriptionMaxLength))}) and (${table.portal_requestable} is not true or btrim(coalesce(${table.portal_description}, '')) <> '')`,
    ),
    index(LineItemTemplatesConstraintName.StatusCreatedAtIndex).on(
      table.status,
      table.created_at.desc(),
    ),
  ],
);
