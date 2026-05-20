import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { CONTACT_REQUEST_KINDS } from "@invessiv/common/constants/contact/contact-request-kind";
import { leads } from "@invessiv/db/record-configuration/leads";

export const leadSubmissions = pgTable(
  "lead_submissions",
  {
    id: uuid("id").primaryKey(),
    lead_id: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    request_id: text("request_id").notNull(),
    channel: text("channel", {
      enum: CONTACT_REQUEST_KINDS,
    }).notNull(),
    locale: text("locale", { enum: ["de", "en"] }).notNull(),
    consent_accepted_at: timestamp("consent_accepted_at", {
      withTimezone: true,
    }).notNull(),
    submission_started_at: timestamp("submission_started_at", {
      withTimezone: true,
    }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "lead_submissions_request_id_check",
      sql`btrim(${table.request_id}) <> ''`,
    ),
    index("lead_submissions_lead_id_created_at_idx").on(
      table.lead_id,
      table.created_at.desc(),
    ),
    index("lead_submissions_channel_created_at_idx").on(
      table.channel,
      table.created_at.desc(),
    ),
  ],
);
