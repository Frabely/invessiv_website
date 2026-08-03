import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { PITCH_AUDIENCE_VALUES } from "@invessiv/common/constants/leads/outreach/lead-pitch-audiences";
import { PITCH_CHANNEL_VALUES } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { PROFILE_SNAPSHOT_SOURCE_VALUES } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import { sqlCheckIn } from "@invessiv/db/core";
import { leads } from "@invessiv/db/record-configuration/leads";

export const leadOutreachDrafts = pgTable(
  "lead_outreach_drafts",
  {
    id: uuid("id").primaryKey(),
    lead_id: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    channel: text("channel", { enum: PITCH_CHANNEL_VALUES }).notNull(),
    audience: text("audience", { enum: PITCH_AUDIENCE_VALUES }).notNull(),
    salutation_name: text("salutation_name").notNull(),
    icebreaker: text("icebreaker").notNull(),
    body: text("body").notNull(),
    char_count: integer("char_count").notNull(),
    model: text("model"),
    profile_source: text("profile_source", {
      enum: PROFILE_SNAPSHOT_SOURCE_VALUES,
    }).notNull(),
    profile_captured_at: timestamp("profile_captured_at", {
      withTimezone: true,
    }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "lead_outreach_drafts_channel_check",
      sqlCheckIn(table.channel, PITCH_CHANNEL_VALUES),
    ),
    check(
      "lead_outreach_drafts_audience_check",
      sqlCheckIn(table.audience, PITCH_AUDIENCE_VALUES),
    ),
    check(
      "lead_outreach_drafts_profile_source_check",
      sqlCheckIn(table.profile_source, PROFILE_SNAPSHOT_SOURCE_VALUES),
    ),
    index("lead_outreach_drafts_lead_id_channel_created_at_idx").on(
      table.lead_id,
      table.channel,
      table.created_at.desc(),
    ),
  ],
);
