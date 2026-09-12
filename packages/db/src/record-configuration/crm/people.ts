import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { SUPPORTED_LOCALES } from "@invessiv/common/contracts/i18n/locale";
import { sqlCheckIn } from "@invessiv/db/core";

/**
 * People are global records. Deliberately no unique index on the email: it never
 * authorizes anything and is not a duplicate guard. Duplicates are prevented by the
 * person search in the dialog (Task 06).
 */
export const people = pgTable(
  "people",
  {
    id: uuid("id").primaryKey(),
    display_name: text("display_name").notNull(),
    first_name: text("first_name"),
    last_name: text("last_name"),
    primary_email: text("primary_email"),
    primary_phone: text("primary_phone"),
    preferred_locale: text("preferred_locale", {
      enum: SUPPORTED_LOCALES,
    }).notNull(),
    notes: text("notes"),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "people_display_name_check",
      sql`btrim
        (
        ${table.display_name}
        )
        <>
        ''`,
    ),
    check(
      "people_preferred_locale_check",
      sqlCheckIn(table.preferred_locale, SUPPORTED_LOCALES),
    ),
    check(
      "people_version_check",
      sql`${table.version}
        > 0`,
    ),
    index("people_primary_email_lower_idx").on(sql`lower(btrim(
            ${table.primary_email}
            )
            )`).where(sql`${table.primary_email}
            is not null`),
  ],
);
