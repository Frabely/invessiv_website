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
import { CustomersConstraintName } from "@invessiv/db/constraint-names/crm/customers-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { leadCategories } from "@invessiv/db/record-configuration/lead-categories";
import { workspaceMembers } from "@invessiv/db/record-configuration/crm/workspace-members";

/**
 * The normalized display name is unique across all statuses — the only guard against
 * creating the same customer twice. Deliberately no unique index on `company_name`:
 * two genuine "Mueller GmbH" in different cities are a valid state.
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
      CustomersConstraintName.DisplayNameCheck,
      sql`btrim
            (
            ${table.display_name}
            )
            <>
            ''`,
    ),
    check(
      CustomersConstraintName.CustomerTypeCheck,
      sqlCheckIn(table.customer_type, CUSTOMER_TYPE_VALUES),
    ),
    check(
      CustomersConstraintName.StatusCheck,
      sqlCheckIn(table.status, CUSTOMER_STATUS_VALUES),
    ),
    check(
      CustomersConstraintName.DefaultHourlyRateCentsCheck,
      sql`${table.default_hourly_rate_cents}
            is null or
            ${table.default_hourly_rate_cents}
            >=
            0`,
    ),
    check(
      CustomersConstraintName.RetentionReviewAfterDaysCheck,
      sql`${table.retention_review_after_days}
            is null or
            ${table.retention_review_after_days}
            >
            0`,
    ),
    check(
      CustomersConstraintName.VersionCheck,
      sql`${table.version}
        > 0`,
    ),
    uniqueIndex(CustomersConstraintName.CustomerNumberUnique).on(
      table.customer_number,
    ),
    uniqueIndex(CustomersConstraintName.IdCustomerNumberUnique).on(
      table.id,
      table.customer_number,
    ),
    uniqueIndex(CustomersConstraintName.DisplayNameLowerUnique).on(
      sql`lower(btrim(
          ${table.display_name}
          )
          )`,
    ),
    index(CustomersConstraintName.StatusCreatedAtIndex).on(
      table.status,
      table.created_at.desc(),
    ),
    index(CustomersConstraintName.CategoryIdIndex).on(table.category_id),
    index(CustomersConstraintName.OwnerMemberIdIndex).on(table.owner_member_id),
  ],
);
