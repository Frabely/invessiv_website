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
import { OnboardingBlockTranslationsConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-block-translations-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";
import { onboardingBlocks } from "./onboarding-blocks";

/** At least one locale per block; the write path checks that, not the database. */
export const onboardingBlockTranslations = pgTable(
  "onboarding_block_translations",
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
      foreignColumns: [onboardingBlocks.id],
    }).onDelete("cascade"),
    check(N.LocaleCheck, sqlCheckIn(t.locale, SUPPORTED_LOCALES)),
    check(
      N.TitleCheck,
      sql`btrim(${t.title}) <> '' and length(${t.title}) <= ${sqlLimit(ONBOARDING_LIMITS.titleMaxLength)}`,
    ),
    check(
      N.IntroCheck,
      sql`length(${t.intro}) <= ${sqlLimit(ONBOARDING_LIMITS.introMaxLength)}`,
    ),
  ],
);
