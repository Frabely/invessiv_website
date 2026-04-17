import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";

export const LEAD_EMAIL_CONTACT_COLUMNS = [
  "id",
  "lead_submission_id",
  "message",
  "created_at",
  "updated_at",
] as const;

export const leadEmailContacts = pgTable("lead_email_contacts", {
  id: uuid("id").primaryKey(),
  lead_submission_id: uuid("lead_submission_id")
    .notNull()
    .references(() => leadSubmissions.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
