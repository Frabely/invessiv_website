import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  CONTACT_LOCALE_VALUES,
  CONTACT_SUBMISSION_CHANNEL_VALUES,
} from "@/server/db/record-configuration/shared";
import { leads } from "@/server/db/record-configuration/leads";

export const LEAD_SUBMISSION_COLUMNS = [
  "id",
  "lead_id",
  "request_id",
  "channel",
  "locale",
  "consent_accepted_at",
  "submission_started_at",
  "created_at",
  "updated_at",
] as const;

export const leadSubmissions = pgTable(
  "lead_submissions",
  {
    id: uuid("id").primaryKey(),
    lead_id: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    request_id: text("request_id").notNull(),
    channel: text("channel", {
      enum: CONTACT_SUBMISSION_CHANNEL_VALUES,
    }).notNull(),
    locale: text("locale", { enum: CONTACT_LOCALE_VALUES }).notNull(),
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
