import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const linkedinPostGeneratorUsageLimits = pgTable(
  "linkedin_post_generator_usage_limits",
  {
    key_hash: text("key_hash").primaryKey(),
    successful_generations: integer("successful_generations")
      .notNull()
      .default(0),
    window_started_at: timestamp("window_started_at", {
      withTimezone: true,
    }).notNull(),
    window_reset_at: timestamp("window_reset_at", {
      withTimezone: true,
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
      "linkedin_post_generator_usage_limits_count_check",
      sql`${table.successful_generations}
            >= 0 and
            ${table.successful_generations}
            <=
            2`,
    ),
    check(
      "linkedin_post_generator_usage_limits_hash_check",
      sql`btrim
            (
            ${table.key_hash}
            )
            <>
            ''`,
    ),
    index("linkedin_post_generator_usage_limits_reset_idx").on(
      table.window_reset_at,
    ),
  ],
);
