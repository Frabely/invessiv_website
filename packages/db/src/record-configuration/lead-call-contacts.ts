import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { CONTACT_PROJECT_SCOPES } from "@invessiv/common/constants/contact/contact-project-scopes";
import { sqlCheckIn } from "@invessiv/db/core";
import { leadSubmissions } from "@invessiv/db/record-configuration/lead-submissions";

export const leadCallContacts = pgTable(
  "lead_call_contacts",
  {
    id: uuid("id").primaryKey(),
    lead_submission_id: uuid("lead_submission_id")
      .notNull()
      .references(() => leadSubmissions.id, { onDelete: "cascade" }),
    message: text("message"),
    project_scope: text("project_scope", {
      enum: CONTACT_PROJECT_SCOPES,
    }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "lead_call_contacts_project_scope_check",
      sqlCheckIn(table.project_scope, CONTACT_PROJECT_SCOPES),
    ),
  ],
);
