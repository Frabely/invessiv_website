import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { ONBOARDING_LIMITS } from "@invessiv/common/constants/crm/onboarding/onboarding-limits";
import { SUPPORTED_LOCALES } from "@invessiv/common/contracts/i18n/locale";
import { OnboardingFieldTranslationsConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-field-translations-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";
import { onboardingFields } from "./onboarding-fields";

/** At least one locale per field; the write path checks that, not the database. */
export const onboardingFieldTranslations = pgTable(
  "onboarding_field_translations",
  {
    field_id: uuid("field_id").notNull(),
    locale: text("locale", { enum: SUPPORTED_LOCALES }).notNull(),
    label: text("label").notNull(),
    help: text("help"),
  },
  (t) => [
    primaryKey({ name: N.PrimaryKey, columns: [t.field_id, t.locale] }),
    foreignKey({
      name: N.FieldForeignKey,
      columns: [t.field_id],
      foreignColumns: [onboardingFields.id],
    }).onDelete("cascade"),
    check(N.LocaleCheck, sqlCheckIn(t.locale, SUPPORTED_LOCALES)),
    check(
      N.LabelCheck,
      sql`btrim(${t.label}) <> '' and length(${t.label}) <= ${sqlLimit(ONBOARDING_LIMITS.labelMaxLength)}`,
    ),
    check(
      N.HelpCheck,
      sql`length(${t.help}) <= ${sqlLimit(ONBOARDING_LIMITS.helpMaxLength)}`,
    ),
  ],
);
