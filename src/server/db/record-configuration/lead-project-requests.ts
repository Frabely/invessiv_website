import { sql } from "drizzle-orm";
import { CONTACT_BUDGET_KEYS } from "@invessiv/common/constants/contact/contact-budget-keys";
import { CONTACT_GOAL_KEYS } from "@invessiv/common/constants/contact/contact-goal-keys";
import { CONTACT_OFFER_KEYS } from "@invessiv/common/constants/contact/contact-offer-keys";
import { CONTACT_START_KEYS } from "@invessiv/common/constants/contact/contact-start-keys";
import { CONTACT_WORKFLOW_KEYS } from "@invessiv/common/constants/contact/contact-workflow-keys";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";

export const leadProjectRequests = pgTable(
  "lead_project_requests",
  {
    id: uuid("id").primaryKey(),
    lead_submission_id: uuid("lead_submission_id")
      .notNull()
      .references(() => leadSubmissions.id, { onDelete: "cascade" }),
    offer_key: text("offer_key", { enum: CONTACT_OFFER_KEYS }).notNull(),
    goal_key: text("goal_key", { enum: CONTACT_GOAL_KEYS }),
    workflow_key: text("workflow_key", { enum: CONTACT_WORKFLOW_KEYS }),
    budget_key: text("budget_key", { enum: CONTACT_BUDGET_KEYS }),
    preferred_start_key: text("preferred_start_key", {
      enum: CONTACT_START_KEYS,
    }),
    company: text("company"),
    role: text("role"),
    phone: text("phone"),
    website: text("website"),
    page_keys: text("page_keys").array(),
    custom_page_names: text("custom_page_names").array(),
    project_details: text("project_details").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "lead_project_requests_project_details_check",
      sql`btrim(${table.project_details}) <> ''`,
    ),
    index("lead_project_requests_offer_key_idx").on(table.offer_key),
  ],
);
