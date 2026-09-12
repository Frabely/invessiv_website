import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { CUSTOMER_STATUS_VALUES } from "@invessiv/common/constants/crm/customer-statuses";
import { CUSTOMER_TYPE_VALUES } from "@invessiv/common/constants/crm/customer-types";
import { sqlCheckIn } from "@invessiv/db/core";
import { leadCategories } from "@invessiv/db/record-configuration/lead-categories";
import { workspaceMembers } from "@invessiv/db/record-configuration/crm/workspace-members";

/**
 * Deliberately no unique index on `company_name`: two genuine "Mueller GmbH" in
 * different cities are a valid state. Task 04 warns about duplicates but never blocks.
 */
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey(),
    customer_number: integer("customer_number").notNull().default(sql`nextval
            ('customers_customer_number_seq')`),
    customer_type: text("customer_type", {
      enum: CUSTOMER_TYPE_VALUES,
    }).notNull(),
    display_name: text("display_name").notNull(),
    company_name: text("company_name"),
    status: text("status", { enum: CUSTOMER_STATUS_VALUES }).notNull(),
    owner_member_id: uuid("owner_member_id")
      .notNull()
      .references(() => workspaceMembers.id),
    category_id: uuid("category_id").references(() => leadCategories.id, {
      onDelete: "set null",
    }),
    street: text("street"),
    postal_code: text("postal_code"),
    city: text("city"),
    country: text("country"),
    website_url: text("website_url"),
    vat_id: text("vat_id"),
    notes: text("notes"),
    default_hourly_rate_cents: integer("default_hourly_rate_cents"),
    retention_review_after_days: integer("retention_review_after_days"),
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
      "customers_display_name_check",
      sql`btrim
            (
            ${table.display_name}
            )
            <>
            ''`,
    ),
    check(
      "customers_customer_type_check",
      sqlCheckIn(table.customer_type, CUSTOMER_TYPE_VALUES),
    ),
    check(
      "customers_status_check",
      sqlCheckIn(table.status, CUSTOMER_STATUS_VALUES),
    ),
    check(
      "customers_default_hourly_rate_cents_check",
      sql`${table.default_hourly_rate_cents}
            is null or
            ${table.default_hourly_rate_cents}
            >=
            0`,
    ),
    check(
      "customers_retention_review_after_days_check",
      sql`${table.retention_review_after_days}
            is null or
            ${table.retention_review_after_days}
            >
            0`,
    ),
    check(
      "customers_version_check",
      sql`${table.version}
        > 0`,
    ),
    uniqueIndex("customers_customer_number_uidx").on(table.customer_number),
    uniqueIndex("customers_id_customer_number_uidx").on(
      table.id,
      table.customer_number,
    ),
    index("customers_status_created_at_idx").on(
      table.status,
      table.created_at.desc(),
    ),
    index("customers_category_id_idx").on(table.category_id),
    index("customers_owner_member_id_idx").on(table.owner_member_id),
  ],
);
