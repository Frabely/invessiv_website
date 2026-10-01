import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";

import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import {
  questionnaireBlocks,
  questionnaireBlockTranslations,
  questionnaireChoiceTranslations,
  questionnaireFieldChoices,
  questionnaireFields,
  questionnaireFieldTranslations,
  questionnaireTemplateBlocks,
} from "@invessiv/db/record-configuration";
import { QuestionnaireCatalogStatusFilter } from "@/common/constants/crm/questionnaire/questionnaire-catalog-status-filters";
import type { QuestionnaireCatalogListFilters } from "@/common/contracts/crm/questionnaire/questionnaire-catalog-list-filters";
import { escapeLikePattern } from "@/common/patterns/crm/sql-like-escape";
import type {
  QuestionnaireBlockOwner,
  QuestionnaireDefinitionRows,
  QuestionnaireReadExecutor,
} from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-types";
import { questionnaireMappingService } from "@/server/workspace/crm/services/questionnaire/questionnaire-mapping-service";

function ownerCondition(owner: QuestionnaireBlockOwner): SQL {
  return owner === null
    ? isNull(questionnaireBlocks.owner_form_id)
    : eq(questionnaireBlocks.owner_form_id, owner);
}

/** Loads blocks with every translation, field and option in six queries, whatever the count. */
async function loadRows(
  executor: QuestionnaireReadExecutor,
  where: SQL,
  orderBy: SQL[] = [asc(questionnaireBlocks.key)],
): Promise<QuestionnaireDefinitionRows> {
  const blocks = await executor
    .select()
    .from(questionnaireBlocks)
    .where(where)
    .orderBy(...orderBy);
  if (blocks.length === 0)
    return {
      blocks,
      blockTranslations: [],
      fields: [],
      fieldTranslations: [],
      choices: [],
      choiceTranslations: [],
    };

  const blockIds = blocks.map((block) => block.id);
  const [blockTranslations, fields] = await Promise.all([
    executor
      .select()
      .from(questionnaireBlockTranslations)
      .where(inArray(questionnaireBlockTranslations.block_id, blockIds)),
    executor
      .select()
      .from(questionnaireFields)
      .where(inArray(questionnaireFields.block_id, blockIds)),
  ]);
  const fieldIds = fields.map((field) => field.id);
  if (fieldIds.length === 0)
    return {
      blocks,
      blockTranslations,
      fields,
      fieldTranslations: [],
      choices: [],
      choiceTranslations: [],
    };

  const [fieldTranslations, choices] = await Promise.all([
    executor
      .select()
      .from(questionnaireFieldTranslations)
      .where(inArray(questionnaireFieldTranslations.field_id, fieldIds)),
    executor
      .select()
      .from(questionnaireFieldChoices)
      .where(inArray(questionnaireFieldChoices.field_id, fieldIds)),
  ]);
  const choiceTranslations =
    choices.length === 0
      ? []
      : await executor
          .select()
          .from(questionnaireChoiceTranslations)
          .where(
            inArray(
              questionnaireChoiceTranslations.choice_id,
              choices.map((choice) => choice.id),
            ),
          );

  return {
    blocks,
    blockTranslations,
    fields,
    fieldTranslations,
    choices,
    choiceTranslations,
  };
}

/** A block of another owner behaves like a missing one. */
async function findBlock(
  executor: QuestionnaireReadExecutor,
  blockId: string,
  owner: QuestionnaireBlockOwner,
): Promise<QuestionnaireBlockDto | null> {
  const rows = await loadRows(
    executor,
    and(eq(questionnaireBlocks.id, blockId), ownerCondition(owner))!,
  );
  return questionnaireMappingService.toBlockDtos(rows)[0] ?? null;
}

/** Blocks in the order of `blockIds`; ids of another owner or unknown ids are left out. */
async function findBlocks(
  executor: QuestionnaireReadExecutor,
  blockIds: readonly string[],
  owner: QuestionnaireBlockOwner,
): Promise<QuestionnaireBlockDto[]> {
  if (blockIds.length === 0) return [];
  const rows = await loadRows(
    executor,
    and(inArray(questionnaireBlocks.id, [...blockIds]), ownerCondition(owner))!,
  );
  const byId = new Map(
    questionnaireMappingService
      .toBlockDtos(rows)
      .map((block) => [block.id, block]),
  );
  return blockIds.flatMap((id) => byId.get(id) ?? []);
}

/** The block a field belongs to, if that block has the given owner. */
async function findFieldBlockId(
  executor: QuestionnaireReadExecutor,
  fieldId: string,
  owner: QuestionnaireBlockOwner,
): Promise<string | null> {
  const [row] = await executor
    .select({ blockId: questionnaireFields.block_id })
    .from(questionnaireFields)
    .innerJoin(
      questionnaireBlocks,
      eq(questionnaireBlocks.id, questionnaireFields.block_id),
    )
    .where(and(eq(questionnaireFields.id, fieldId), ownerCondition(owner)))
    .limit(1);
  return row?.blockId ?? null;
}

/** The search matches the key or a title in any locale. */
function catalogFilterCondition(
  executor: QuestionnaireReadExecutor,
  filters: QuestionnaireCatalogListFilters,
): SQL {
  const conditions: SQL[] = [ownerCondition(null)];
  if (filters.status !== QuestionnaireCatalogStatusFilter.All)
    conditions.push(eq(questionnaireBlocks.status, filters.status));
  if (filters.search) {
    const pattern = `%${escapeLikePattern(filters.search)}%`;
    conditions.push(
      or(
        ilike(questionnaireBlocks.key, pattern),
        exists(
          executor
            .select({ blockId: questionnaireBlockTranslations.block_id })
            .from(questionnaireBlockTranslations)
            .where(
              and(
                eq(
                  questionnaireBlockTranslations.block_id,
                  questionnaireBlocks.id,
                ),
                ilike(questionnaireBlockTranslations.title, pattern),
              ),
            ),
        ),
      )!,
    );
  }
  return and(...conditions)!;
}

async function listCatalogBlocks(
  executor: QuestionnaireReadExecutor,
  filters: QuestionnaireCatalogListFilters,
): Promise<QuestionnaireBlockDto[]> {
  const rows = await loadRows(
    executor,
    catalogFilterCondition(executor, filters),
    [desc(questionnaireBlocks.created_at), asc(questionnaireBlocks.key)],
  );
  return questionnaireMappingService.toBlockDtos(rows);
}

/**
 * Block keys are unique within one owner: across the catalog, or across the blocks of one form.
 * A form's copy keeps the key of its origin, so it never collides with the catalog.
 */
async function isBlockKeyTaken(
  executor: QuestionnaireReadExecutor,
  owner: QuestionnaireBlockOwner,
  key: string,
): Promise<boolean> {
  const [row] = await executor
    .select({ id: questionnaireBlocks.id })
    .from(questionnaireBlocks)
    .where(and(eq(questionnaireBlocks.key, key), ownerCondition(owner)))
    .limit(1);
  return row !== undefined;
}

async function hasCatalogBlocks(
  executor: QuestionnaireReadExecutor,
): Promise<boolean> {
  const [row] = await executor
    .select({ id: questionnaireBlocks.id })
    .from(questionnaireBlocks)
    .where(ownerCondition(null))
    .limit(1);
  return row !== undefined;
}

/** How many templates use each block; blocks without a template are missing from the map. */
async function countTemplateUsage(
  executor: QuestionnaireReadExecutor,
  blockIds: readonly string[],
): Promise<Map<string, number>> {
  if (blockIds.length === 0) return new Map();
  const rows = await executor
    .select({
      blockId: questionnaireTemplateBlocks.block_id,
      templates: count(),
    })
    .from(questionnaireTemplateBlocks)
    .where(inArray(questionnaireTemplateBlocks.block_id, [...blockIds]))
    .groupBy(questionnaireTemplateBlocks.block_id);
  return new Map(rows.map((row) => [row.blockId, row.templates]));
}

export const questionnaireDefinitionReadService = {
  countTemplateUsage,
  findBlock,
  findBlocks,
  findFieldBlockId,
  hasCatalogBlocks,
  isBlockKeyTaken,
  listCatalogBlocks,
  ownerCondition,
} as const;
