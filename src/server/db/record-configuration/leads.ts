import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { LEAD_STATUS_VALUES } from "@/server/db/record-configuration/shared";

export const LEAD_COLUMNS = [
  "id",
  "first_name",
  "last_name",
  "email",
  "lead_status",
  "owner",
  "created_at",
  "updated_at",
] as const;

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey(),
    first_name: text("first_name").notNull(),
    last_name: text("last_name").notNull(),
    email: text("email").notNull(),
    lead_status: text("lead_status", { enum: LEAD_STATUS_VALUES })
      .notNull()
      .default("new"),
    owner: text("owner"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("leads_first_name_check", sql`btrim(${table.first_name}) <> ''`),
    check("leads_last_name_check", sql`btrim(${table.last_name}) <> ''`),
    check("leads_email_check", sql`btrim(${table.email}) <> ''`),
    uniqueIndex("leads_email_lower_uidx").on(sql`lower(btrim(${table.email}))`),
    index("leads_status_created_at_idx").on(
      table.lead_status,
      table.created_at.desc(),
    ),
  ],
);
