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
import { QuestionnaireBlockTranslationsConstraintName as N } from "@invessiv/db/constraint-names/crm/questionnaire-block-translations-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";
import { questionnaireBlocks } from "./questionnaire-blocks";

/** At least one locale per block; the write path checks that, not the database. */
export const questionnaireBlockTranslations = pgTable(
  "questionnaire_block_translations",
  {
    block_id: uuid("block_id").notNull(),
    locale: text("locale", { enum: SUPPORTED_LOCALES }).notNull(),
    title: text("title").notNull(),
    intro: text("intro"),
  },
  (t) => [
    primaryKey({ name: N.PrimaryKey, columns: [t.block_id, t.locale] }),
    foreignKey({
      name: N.BlockForeignKey,
      columns: [t.block_id],
      foreignColumns: [questionnaireBlocks.id],
    }).onDelete("cascade"),
    check(N.LocaleCheck, sqlCheckIn(t.locale, SUPPORTED_LOCALES)),
    check(
      N.TitleCheck,
      sql`btrim(${t.title}) <> '' and length(${t.title}) <= ${sqlLimit(QUESTIONNAIRE_LIMITS.titleMaxLength)}`,
    ),
    check(
      N.IntroCheck,
      sql`length(${t.intro}) <= ${sqlLimit(QUESTIONNAIRE_LIMITS.introMaxLength)}`,
    ),
  ],
);
