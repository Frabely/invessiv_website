import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  ONBOARDING_CATALOG_STATUS_VALUES,
  OnboardingCatalogStatus,
} from "@invessiv/common/constants/crm/onboarding/onboarding-catalog-statuses";
import { ONBOARDING_KEY_PATTERN_SOURCE } from "@invessiv/common/constants/crm/onboarding/onboarding-key-patterns";
import { OnboardingBlocksConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-blocks-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { onboardingForms } from "./onboarding-forms";

/**
 * Catalog and forms share this table: `owner_form_id` null is a catalog block, otherwise the
 * block is the snapshot copy owned by exactly that form. Catalog edits never touch a copy.
 * `source_block_id` keeps the origin so a follow-up form can pre-fill "the same" block.
 */
export const onboardingBlocks = pgTable(
  "onboarding_blocks",
  {
    id: uuid("id").primaryKey(),
    owner_form_id: uuid("owner_form_id"),
    source_block_id: uuid("source_block_id"),
    key: text("key").notNull(),
    carry_over: boolean("carry_over").notNull(),
    status: text("status", {
      enum: ONBOARDING_CATALOG_STATUS_VALUES,
    }).notNull(),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: N.OwnerFormForeignKey,
      columns: [t.owner_form_id],
      foreignColumns: [onboardingForms.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.SourceBlockForeignKey,
      columns: [t.source_block_id],
      foreignColumns: [t.id],
    }).onDelete("set null"),
    unique(N.IdOwnerUnique).on(t.id, t.owner_form_id),
    check(
      N.KeyCheck,
      sql`${t.key} ~ ${sql.raw(`'${ONBOARDING_KEY_PATTERN_SOURCE}'`)}`,
    ),
    check(
      N.StatusCheck,
      sqlCheckIn(t.status, ONBOARDING_CATALOG_STATUS_VALUES),
    ),
    check(N.VersionCheck, sql`${t.version} > 0`),
    check(
      N.OwnerStatusCheck,
      sql`${t.owner_form_id} is null or ${t.status} = ${OnboardingCatalogStatus.Active}`,
    ),
    check(
      N.CatalogSourceCheck,
      sql`${t.owner_form_id} is not null or ${t.source_block_id} is null`,
    ),
    uniqueIndex(N.CatalogKeyUnique)
      .on(t.key)
      .where(sql`${t.owner_form_id} is null`),
    index(N.OwnerIndex).on(t.owner_form_id),
    index(N.SourceIndex)
      .on(t.source_block_id)
      .where(sql`${t.source_block_id} is not null`),
  ],
);
