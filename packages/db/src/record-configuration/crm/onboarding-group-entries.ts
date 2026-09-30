import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { ONBOARDING_LIMITS } from "@invessiv/common/constants/crm/onboarding/onboarding-limits";
import { OnboardingGroupEntriesConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-group-entries-constraint-names";
import { sqlLimit } from "@invessiv/db/core";
import { onboardingFields } from "./onboarding-fields";
import { onboardingForms } from "./onboarding-forms";

/** One repetition of a group field. The id comes from the client so it stays stable across autosaves. */
export const onboardingGroupEntries = pgTable(
  "onboarding_group_entries",
  {
    id: uuid("id").primaryKey(),
    form_id: uuid("form_id").notNull(),
    field_id: uuid("field_id").notNull(),
    position: integer("position").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: N.FormForeignKey,
      columns: [t.form_id],
      foreignColumns: [onboardingForms.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.FieldForeignKey,
      columns: [t.field_id],
      foreignColumns: [onboardingFields.id],
    }).onDelete("cascade"),
    // DEFERRABLE INITIALLY IMMEDIATE in the migration; Drizzle cannot express it.
    unique(N.PositionUnique).on(t.field_id, t.position),
    unique(N.IdFormUnique).on(t.id, t.form_id),
    check(
      N.PositionCheck,
      sql`${t.position} >= 0 and ${t.position} < ${sqlLimit(ONBOARDING_LIMITS.storedPositionCeiling)}`,
    ),
  ],
);
