import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  type PgTableExtraConfigValue,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { ONBOARDING_FIELD_REQUIREMENT_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-field-requirements";
import {
  ONBOARDING_FIELD_TYPE_VALUES,
  ONBOARDING_GROUP_CHILD_EXCLUDED_TYPE_VALUES,
  ONBOARDING_ITEM_COUNT_FIELD_TYPE_VALUES,
  ONBOARDING_LENGTH_LIMITED_FIELD_TYPE_VALUES,
  OnboardingFieldType,
} from "@invessiv/common/constants/crm/onboarding/onboarding-field-types";
import { ONBOARDING_KEY_PATTERN_SOURCE } from "@invessiv/common/constants/crm/onboarding/onboarding-key-patterns";
import { ONBOARDING_LIMITS } from "@invessiv/common/constants/crm/onboarding/onboarding-limits";
import { ONBOARDING_PREFILL_SOURCE_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-prefill-sources";
import { ASSET_KIND_VALUES } from "@invessiv/common/constants/files/asset-kind";
import { OnboardingFieldsConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-fields-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";
import { onboardingBlocks } from "./onboarding-blocks";
import { onboardingFieldChoices } from "./onboarding-field-choices";

/**
 * One question of a block. `parent_field_id` points to a group field of the same block, exactly
 * one level deep. A condition names a choice of a trigger field; that the trigger sits in the same
 * block on the same level with a lower position is checked by the write path. The single composite
 * key on the condition clears both columns together when the choice disappears.
 * `accepted_asset_kinds` is a subset of `ASSET_KIND_VALUES`, checked by the application.
 */
export const onboardingFields = pgTable(
  "onboarding_fields",
  {
    id: uuid("id").primaryKey(),
    block_id: uuid("block_id").notNull(),
    parent_field_id: uuid("parent_field_id"),
    key: text("key").notNull(),
    position: integer("position").notNull(),
    type: text("type", { enum: ONBOARDING_FIELD_TYPE_VALUES }).notNull(),
    requirement: text("requirement", {
      enum: ONBOARDING_FIELD_REQUIREMENT_VALUES,
    }).notNull(),
    max_length: integer("max_length"),
    min_items: integer("min_items"),
    max_items: integer("max_items"),
    accepted_asset_kinds: text("accepted_asset_kinds", {
      enum: ASSET_KIND_VALUES,
    }).array(),
    prefill_source: text("prefill_source", {
      enum: ONBOARDING_PREFILL_SOURCE_VALUES,
    }),
    condition_field_id: uuid("condition_field_id"),
    condition_choice_id: uuid("condition_choice_id"),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // Annotated because fields and choices reference each other; inference would loop otherwise.
  (t): PgTableExtraConfigValue[] => [
    foreignKey({
      name: N.BlockForeignKey,
      columns: [t.block_id],
      foreignColumns: [onboardingBlocks.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.ParentForeignKey,
      columns: [t.parent_field_id],
      foreignColumns: [t.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.ConditionChoiceForeignKey,
      columns: [t.condition_choice_id, t.condition_field_id],
      foreignColumns: [
        onboardingFieldChoices.id,
        onboardingFieldChoices.field_id,
      ],
    }).onDelete("set null"),
    unique(N.BlockKeyUnique).on(t.block_id, t.key),
    // DEFERRABLE INITIALLY IMMEDIATE in the migration; Drizzle cannot express it. A reorder defers
    // it for its own transaction to swap positions.
    unique(N.PositionUnique)
      .on(t.block_id, t.parent_field_id, t.position)
      .nullsNotDistinct(),
    check(
      N.KeyCheck,
      sql`${t.key} ~ ${sql.raw(`'${ONBOARDING_KEY_PATTERN_SOURCE}'`)}`,
    ),
    check(
      N.PositionCheck,
      sql`${t.position} >= 0 and ${t.position} < ${sqlLimit(ONBOARDING_LIMITS.storedPositionCeiling)}`,
    ),
    check(N.TypeCheck, sqlCheckIn(t.type, ONBOARDING_FIELD_TYPE_VALUES)),
    check(
      N.RequirementCheck,
      sqlCheckIn(t.requirement, ONBOARDING_FIELD_REQUIREMENT_VALUES),
    ),
    check(
      N.MaxLengthCheck,
      sql`${t.max_length} between 1 and ${sqlLimit(ONBOARDING_LIMITS.storedValueMaxLength)}`,
    ),
    check(
      N.MinItemsCheck,
      sql`${t.min_items} between 0 and ${sqlLimit(ONBOARDING_LIMITS.storedItemCountCeiling)}`,
    ),
    check(
      N.MaxItemsCheck,
      sql`${t.max_items} between 1 and ${sqlLimit(ONBOARDING_LIMITS.storedItemCountCeiling)}`,
    ),
    check(
      N.PrefillSourceCheck,
      sqlCheckIn(t.prefill_source, ONBOARDING_PREFILL_SOURCE_VALUES),
    ),
    check(N.VersionCheck, sql`${t.version} > 0`),
    check(
      N.ConditionPairCheck,
      sql`(${t.condition_field_id} is null) = (${t.condition_choice_id} is null)`,
    ),
    check(
      N.ItemRangeCheck,
      sql`${t.min_items} is null or ${t.max_items} is null or ${t.min_items} <= ${t.max_items}`,
    ),
    check(
      N.MaxLengthTypeCheck,
      sql`${t.max_length} is null or ${sqlCheckIn(t.type, ONBOARDING_LENGTH_LIMITED_FIELD_TYPE_VALUES)}`,
    ),
    check(
      N.ItemCountTypeCheck,
      sql`(${t.min_items} is null and ${t.max_items} is null) or ${sqlCheckIn(t.type, ONBOARDING_ITEM_COUNT_FIELD_TYPE_VALUES)}`,
    ),
    check(
      N.AssetKindsTypeCheck,
      sql`${t.accepted_asset_kinds} is null or ${t.type} = ${OnboardingFieldType.Files}`,
    ),
    check(
      N.ParentTypeCheck,
      sql`${t.parent_field_id} is null or not (${sqlCheckIn(t.type, ONBOARDING_GROUP_CHILD_EXCLUDED_TYPE_VALUES)})`,
    ),
    index(N.BlockIndex).on(t.block_id, t.position),
  ],
);
