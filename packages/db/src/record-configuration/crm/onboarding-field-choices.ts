import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  pgTable,
  type PgTableExtraConfigValue,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { ONBOARDING_CHOICE_KEY_PATTERN_SOURCE } from "@invessiv/common/constants/crm/onboarding/onboarding-key-patterns";
import { ONBOARDING_LIMITS } from "@invessiv/common/constants/crm/onboarding/onboarding-limits";
import { OnboardingFieldChoicesConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-field-choices-constraint-names";
import { sqlLimit } from "@invessiv/db/core";
import { onboardingFields } from "./onboarding-fields";

/** Options of a choice, multi choice, yes/no or scale field; `(id, field_id)` is the target of answers and conditions. */
export const onboardingFieldChoices = pgTable(
  "onboarding_field_choices",
  {
    id: uuid("id").primaryKey(),
    field_id: uuid("field_id").notNull(),
    key: text("key").notNull(),
    position: integer("position").notNull(),
    version: integer("version").notNull(),
  },
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: N.FieldForeignKey,
      columns: [t.field_id],
      foreignColumns: [onboardingFields.id],
    }).onDelete("cascade"),
    unique(N.FieldKeyUnique).on(t.field_id, t.key),
    // DEFERRABLE INITIALLY IMMEDIATE in the migration; Drizzle cannot express it.
    unique(N.PositionUnique).on(t.field_id, t.position),
    unique(N.IdFieldUnique).on(t.id, t.field_id),
    check(
      N.KeyCheck,
      sql`${t.key} ~ ${sql.raw(`'${ONBOARDING_CHOICE_KEY_PATTERN_SOURCE}'`)}`,
    ),
    check(
      N.PositionCheck,
      sql`${t.position} >= 0 and ${t.position} < ${sqlLimit(ONBOARDING_LIMITS.storedChoicePositionCeiling)}`,
    ),
    check(N.VersionCheck, sql`${t.version} > 0`),
  ],
);
