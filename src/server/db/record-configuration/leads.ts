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

import { CONTACT_LEAD_STATUS_VALUES } from "@/common/constants/contact/contact-lead-statuses";
import { LeadFieldLimits } from "@/common/constants/leads/lead-field-limits";
import { LEAD_SOURCES_VALUES } from "@/common/constants/leads/lead-sources";
import { sqlCheckIn } from "@/server/db/core";
import { leadCategories } from "@/server/db/record-configuration/lead-categories";

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey(),
    first_name: text("first_name"),
    last_name: text("last_name"),
    company_name: text("company_name"),
    email: text("email").notNull(),
    phone: text("phone"),
    website_url: text("website_url"),
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
      "leads_last_name_or_company_name_check",
      sql`nullif(btrim(${table.last_name}), '') is not null or nullif(btrim(${table.company_name}), '') is not null`,
    ),
    check(
      "leads_score_check",
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
    check("leads_source_check", sqlCheckIn(table.source, LEAD_SOURCES_VALUES)),
    check(
      "leads_lead_status_check",
      sqlCheckIn(table.lead_status, CONTACT_LEAD_STATUS_VALUES),
    ),
    check("leads_email_check", sql`btrim(${table.email}) <> ''`),
    uniqueIndex("leads_email_lower_uidx").on(sql`lower(btrim(${table.email}))`),
    index("leads_source_created_at_idx").on(
      table.source,
      table.created_at.desc(),
    ),
    index("leads_category_created_at_idx").on(
      table.category_id,
      table.created_at.desc(),
    ),
    uniqueIndex("leads_external_guid_uidx")
      .on(table.external_guid)
      .where(sql`${table.external_guid} is not null`),
  ],
);
