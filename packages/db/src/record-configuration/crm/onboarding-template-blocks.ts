import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { ONBOARDING_LIMITS } from "@invessiv/common/constants/crm/onboarding/onboarding-limits";
import { OnboardingTemplateBlocksConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-template-blocks-constraint-names";
import { sqlLimit } from "@invessiv/db/core";
import { onboardingBlocks } from "./onboarding-blocks";
import { onboardingTemplates } from "./onboarding-templates";

/**
 * The ordered block selection of a template. Only catalog blocks belong here; that spans two
 * tables and is enforced by the write path. A referenced block cannot be deleted, only archived.
 */
export const onboardingTemplateBlocks = pgTable(
  "onboarding_template_blocks",
  {
    template_id: uuid("template_id").notNull(),
    block_id: uuid("block_id").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [
    primaryKey({ name: N.PrimaryKey, columns: [t.template_id, t.block_id] }),
    foreignKey({
      name: N.TemplateForeignKey,
      columns: [t.template_id],
      foreignColumns: [onboardingTemplates.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.BlockForeignKey,
      columns: [t.block_id],
      foreignColumns: [onboardingBlocks.id],
    }).onDelete("restrict"),
    // DEFERRABLE INITIALLY IMMEDIATE in the migration; Drizzle cannot express it.
    unique(N.PositionUnique).on(t.template_id, t.position),
    check(
      N.PositionCheck,
      sql`${t.position} >= 0 and ${t.position} < ${sqlLimit(ONBOARDING_LIMITS.storedPositionCeiling)}`,
    ),
  ],
);
