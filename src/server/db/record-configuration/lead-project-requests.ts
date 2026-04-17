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
  PROJECT_REQUEST_BUDGET_KEYS,
  PROJECT_REQUEST_GOAL_KEYS,
  PROJECT_REQUEST_OFFER_KEYS,
  PROJECT_REQUEST_PREFERRED_START_KEYS,
  PROJECT_REQUEST_WORKFLOW_KEYS,
} from "@/server/db/record-configuration/shared";
import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";

export const LEAD_PROJECT_REQUEST_COLUMNS = [
  "id",
  "lead_submission_id",
  "offer_key",
  "goal_key",
  "workflow_key",
  "budget_key",
  "preferred_start_key",
  "company",
  "role",
  "phone",
  "website",
  "page_keys",
  "custom_page_names",
  "project_details",
  "created_at",
  "updated_at",
] as const;

export const leadProjectRequests = pgTable(
  "lead_project_requests",
  {
    id: uuid("id").primaryKey(),
    lead_submission_id: uuid("lead_submission_id")
      .notNull()
      .references(() => leadSubmissions.id, { onDelete: "cascade" }),
    offer_key: text("offer_key", {
      enum: PROJECT_REQUEST_OFFER_KEYS,
    }).notNull(),
    goal_key: text("goal_key", { enum: PROJECT_REQUEST_GOAL_KEYS }),
    workflow_key: text("workflow_key", { enum: PROJECT_REQUEST_WORKFLOW_KEYS }),
    budget_key: text("budget_key", { enum: PROJECT_REQUEST_BUDGET_KEYS }),
    preferred_start_key: text("preferred_start_key", {
      enum: PROJECT_REQUEST_PREFERRED_START_KEYS,
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
