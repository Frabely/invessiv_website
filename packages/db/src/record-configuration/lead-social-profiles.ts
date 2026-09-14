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

import { LEAD_SOCIAL_PLATFORMS_VALUES } from "@invessiv/common/constants/leads/social/lead-social-platforms";
import { LeadSocialProfilesConstraintName } from "@invessiv/db/constraint-names/lead-social-profiles-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { leads } from "@invessiv/db/record-configuration/leads";

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
      LeadSocialProfilesConstraintName.PlatformCheck,
      sqlCheckIn(table.platform, LEAD_SOCIAL_PLATFORMS_VALUES),
    ),
    check(
      LeadSocialProfilesConstraintName.ProfileUrlCheck,
      sql`btrim(${table.profile_url}) <> ''`,
    ),
    check(
      LeadSocialProfilesConstraintName.NormalizedUrlCheck,
      sql`btrim(${table.normalized_url}) <> ''`,
    ),
    index(LeadSocialProfilesConstraintName.LeadIdIndex).on(table.lead_id),
    uniqueIndex(
      LeadSocialProfilesConstraintName.PlatformNormalizedUrlUnique,
    ).on(table.platform, table.normalized_url),
  ],
);
