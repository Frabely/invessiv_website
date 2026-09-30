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
import { OnboardingChoiceTranslationsConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-choice-translations-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";
import { onboardingFieldChoices } from "./onboarding-field-choices";

/** At least one locale per choice; the write path checks that, not the database. */
export const onboardingChoiceTranslations = pgTable(
  "onboarding_choice_translations",
  {
    choice_id: uuid("choice_id").notNull(),
    locale: text("locale", { enum: SUPPORTED_LOCALES }).notNull(),
    label: text("label").notNull(),
  },
  (t) => [
    primaryKey({ name: N.PrimaryKey, columns: [t.choice_id, t.locale] }),
    foreignKey({
      name: N.ChoiceForeignKey,
      columns: [t.choice_id],
      foreignColumns: [onboardingFieldChoices.id],
    }).onDelete("cascade"),
    check(N.LocaleCheck, sqlCheckIn(t.locale, SUPPORTED_LOCALES)),
    check(
      N.LabelCheck,
      sql`btrim(${t.label}) <> '' and length(${t.label}) <= ${sqlLimit(ONBOARDING_LIMITS.choiceLabelMaxLength)}`,
    ),
  ],
);
