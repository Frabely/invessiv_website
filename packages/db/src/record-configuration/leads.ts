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

import { CONTACT_LEAD_STATUS_VALUES } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadFieldLimits } from "@invessiv/common/constants/leads/forms/lead-field-limits";
import { LEAD_SOURCES_VALUES } from "@invessiv/common/constants/leads/sources/lead-sources";
import { LeadsConstraintName } from "@invessiv/db/constraint-names/leads-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { leadCategories } from "@invessiv/db/record-configuration/lead-categories";
import { customers } from "@invessiv/db/record-configuration/crm/customers";

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey(),
    display_name: text("display_name").notNull(),
    first_name: text("first_name"),
    last_name: text("last_name"),
    company_name: text("company_name"),
    email: text("email"),
    phone: text("phone"),
    website_url: text("website_url"),
    customer_id: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    category_id: uuid("category_id").references(() => leadCategories.id, {
      onDelete: "set null",
    }),
    score: integer("score"),
    source: text("source", { enum: LEAD_SOURCES_VALUES }).notNull(),
    lead_status: text("lead_status", { enum: CONTACT_LEAD_STATUS_VALUES })
      .notNull()
      .default("new"),
    owner: text("owner"),
    notes: text("notes"),
    improvements: text("improvements").array(),
    external_guid: text("external_guid"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      LeadsConstraintName.ScoreCheck,
      sql`${table.score}
        is null or (
        ${table.score}
        >=
        ${LeadFieldLimits.ScoreMin}
        and
        ${table.score}
        <=
        ${LeadFieldLimits.ScoreMax}
        )`,
    ),
    check(
      LeadsConstraintName.SourceCheck,
      sqlCheckIn(table.source, LEAD_SOURCES_VALUES),
    ),
    check(
      LeadsConstraintName.LeadStatusCheck,
      sqlCheckIn(table.lead_status, CONTACT_LEAD_STATUS_VALUES),
    ),
    uniqueIndex(LeadsConstraintName.EmailLowerUnique).on(sql`lower(btrim(
          ${table.email}
          )
          )`).where(sql`${table.email}
          is not null`),
    uniqueIndex(LeadsConstraintName.CompanyNameLowerUnique).on(sql`lower(btrim(
          ${table.company_name}
          )
          )`).where(sql`${table.company_name}
          is not null`),
    index(LeadsConstraintName.SourceCreatedAtIndex).on(
      table.source,
      table.created_at.desc(),
    ),
    index(LeadsConstraintName.CategoryCreatedAtIndex).on(
      table.category_id,
      table.created_at.desc(),
    ),
    index(LeadsConstraintName.CustomerIdIndex).on(table.customer_id),
    uniqueIndex(LeadsConstraintName.ExternalGuidUnique)
      .on(table.external_guid)
      .where(sql`${table.external_guid} is not null`),
  ],
);
