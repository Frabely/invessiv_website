import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { ACTIVITY_TYPE_VALUES } from "@invessiv/common/constants/activity/activity-types";
import { ACTOR_TYPE_VALUES } from "@invessiv/common/constants/activity/actor-types";
import { sqlCheckIn } from "@invessiv/db/core";
import { customers } from "@invessiv/db/record-configuration/crm/customers";
import { leads } from "@invessiv/db/record-configuration/leads";

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey(),
    lead_id: uuid("lead_id").references(() => leads.id, {
      onDelete: "cascade",
    }),
    customer_id: uuid("customer_id").references(() => customers.id, {
      onDelete: "cascade",
    }),
    project_id: uuid("project_id"),
    type: text("type", { enum: ACTIVITY_TYPE_VALUES }).notNull(),
    title: text("title"),
    body: text("body"),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    occurred_at: timestamp("occurred_at", { withTimezone: true }).notNull(),
    actor_type: text("actor_type", { enum: ACTOR_TYPE_VALUES }).notNull(),
    actor_id: text("actor_id"),
    actor_label: text("actor_label"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "activities_subject_check",
      sql`${table.lead_id}
        is not null or
        ${table.customer_id}
        is
        not
        null`,
    ),
    check(
      "activities_type_check",
      sqlCheckIn(table.type, ACTIVITY_TYPE_VALUES),
    ),
    check(
      "activities_actor_type_check",
      sqlCheckIn(table.actor_type, ACTOR_TYPE_VALUES),
    ),
    index("activities_customer_id_occurred_at_idx").on(
      table.customer_id,
      table.occurred_at.desc(),
      table.id.desc(),
    ).where(sql`${table.customer_id}
          is not null`),
    index("activities_lead_id_occurred_at_idx").on(
      table.lead_id,
      table.occurred_at.desc(),
      table.id.desc(),
    ).where(sql`${table.lead_id}
          is not null`),
    index("activities_project_id_occurred_at_idx").on(
      table.project_id,
      table.occurred_at.desc(),
      table.id.desc(),
    ).where(sql`${table.project_id}
          is not null`),
    index("activities_type_occurred_at_idx").on(table.type, table.occurred_at),
  ],
);
