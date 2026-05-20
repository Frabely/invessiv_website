import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { LEAD_ACTIVITY_TYPE_VALUES } from "@invessiv/common/constants/leads/activity/lead-activity-types";
import { LEAD_ACTOR_TYPE_VALUES } from "@invessiv/common/constants/leads/activity/lead-actor-types";
import { sqlCheckIn } from "@invessiv/db/core";
import { leads } from "@invessiv/db/record-configuration/leads";

export const leadActivities = pgTable(
  "lead_activities",
  {
    id: uuid("id").primaryKey(),
    lead_id: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    type: text("type", { enum: LEAD_ACTIVITY_TYPE_VALUES }).notNull(),
    title: text("title"),
    body: text("body"),
    metadata: jsonb("metadata"),
    occurred_at: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    actor_type: text("actor_type", { enum: LEAD_ACTOR_TYPE_VALUES }).notNull(),
    actor_id: text("actor_id"),
    actor_label: text("actor_label"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "lead_activities_type_check",
      sqlCheckIn(table.type, LEAD_ACTIVITY_TYPE_VALUES),
    ),
    check(
      "lead_activities_actor_type_check",
      sqlCheckIn(table.actor_type, LEAD_ACTOR_TYPE_VALUES),
    ),
    index("lead_activities_lead_id_occurred_at_idx").on(
      table.lead_id,
      table.occurred_at.desc(),
    ),
  ],
);
