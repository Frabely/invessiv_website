import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const leadCategories = pgTable(
  "lead_categories",
  {
    id: uuid("id").primaryKey(),
    slug: text("slug").notNull(),
    label_key: text("label_key").notNull(),
    description: text("description"),
    is_active: boolean("is_active").notNull().default(true),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("lead_categories_slug_check", sql`btrim(${table.slug}) <> ''`),
    check(
      "lead_categories_label_key_check",
      sql`btrim(${table.label_key}) <> ''`,
    ),
    check(
      "lead_categories_description_check",
      sql`${table.description} is null or btrim(${table.description}) <> ''`,
    ),
    check("lead_categories_sort_order_check", sql`${table.sort_order} >= 0`),
    uniqueIndex("lead_categories_slug_uidx").on(table.slug),
  ],
);
