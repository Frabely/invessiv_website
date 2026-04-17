import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";

export const leadCallContacts = pgTable("lead_call_contacts", {
  id: uuid("id").primaryKey(),
  lead_submission_id: uuid("lead_submission_id")
    .notNull()
    .references(() => leadSubmissions.id, { onDelete: "cascade" }),
  message: text("message"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
