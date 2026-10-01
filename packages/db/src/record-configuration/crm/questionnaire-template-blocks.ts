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
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { QuestionnaireTemplateBlocksConstraintName as N } from "@invessiv/db/constraint-names/crm/questionnaire-template-blocks-constraint-names";
import { sqlLimit } from "@invessiv/db/core";
import { questionnaireBlocks } from "./questionnaire-blocks";
import { questionnaireTemplates } from "./questionnaire-templates";

/**
 * The ordered block selection of a template. Only catalog blocks belong here; that spans two
 * tables and is enforced by the write path. A referenced block cannot be deleted, only archived.
 */
export const questionnaireTemplateBlocks = pgTable(
  "questionnaire_template_blocks",
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
      foreignColumns: [questionnaireTemplates.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.BlockForeignKey,
      columns: [t.block_id],
      foreignColumns: [questionnaireBlocks.id],
    }).onDelete("restrict"),
    // DEFERRABLE INITIALLY IMMEDIATE in the migration; Drizzle cannot express it.
    unique(N.PositionUnique).on(t.template_id, t.position),
    check(
      N.PositionCheck,
      sql`${t.position} >= 0 and ${t.position} < ${sqlLimit(QUESTIONNAIRE_LIMITS.storedPositionCeiling)}`,
    ),
  ],
);
