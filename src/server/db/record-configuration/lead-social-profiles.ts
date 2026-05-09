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

import { LEAD_SOCIAL_PLATFORMS_VALUES } from "@/common/constants/leads/social/lead-social-platforms";
import { sqlCheckIn } from "@/server/db/core";
import { leads } from "@/server/db/record-configuration/leads";

export const leadSocialProfiles = pgTable(
  "lead_social_profiles",
  {
    id: uuid("id").primaryKey(),
    lead_id: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    platform: text("platform", {
      enum: LEAD_SOCIAL_PLATFORMS_VALUES,
    }).notNull(),
    profile_url: text("profile_url").notNull(),
    normalized_url: text("normalized_url").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "lead_social_profiles_platform_check",
      sqlCheckIn(table.platform, LEAD_SOCIAL_PLATFORMS_VALUES),
    ),
    check(
      "lead_social_profiles_profile_url_check",
      sql`btrim(${table.profile_url}) <> ''`,
    ),
    check(
      "lead_social_profiles_normalized_url_check",
      sql`btrim(${table.normalized_url}) <> ''`,
    ),
    index("lead_social_profiles_lead_id_idx").on(table.lead_id),
    uniqueIndex("lead_social_profiles_lead_platform_url_uidx").on(
      table.lead_id,
      table.platform,
      table.normalized_url,
    ),
  ],
);
