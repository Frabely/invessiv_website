import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { SUPPORTED_LOCALES } from "@invessiv/common/contracts/i18n/locale";
import { QuestionnaireChoiceTranslationsConstraintName as N } from "@invessiv/db/constraint-names/crm/questionnaire-choice-translations-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";
import { questionnaireFieldChoices } from "./questionnaire-field-choices";

/** At least one locale per choice; the write path checks that, not the database. */
export const questionnaireChoiceTranslations = pgTable(
  "questionnaire_choice_translations",
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
      foreignColumns: [questionnaireFieldChoices.id],
    }).onDelete("cascade"),
    check(N.LocaleCheck, sqlCheckIn(t.locale, SUPPORTED_LOCALES)),
    check(
      N.LabelCheck,
      sql`btrim(${t.label}) <> '' and length(${t.label}) <= ${sqlLimit(QUESTIONNAIRE_LIMITS.choiceLabelMaxLength)}`,
    ),
  ],
);
