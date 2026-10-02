import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireChoiceDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-choice.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import type { CreateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-block-request.dto";
import type { UpdateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-block-request.dto";
import type { QuestionnaireFieldInputDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field-input.dto";
import { moveListItem } from "@invessiv/common/patterns/collections/ordered-list";
import {
  findQuestionnaireField as findField,
  questionnaireFieldLevel,
} from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { QuestionnaireFieldChoicesConstraintName } from "@invessiv/db/constraint-names/crm/questionnaire-field-choices-constraint-names";
import { QuestionnaireFieldsConstraintName } from "@invessiv/db/constraint-names/crm/questionnaire-fields-constraint-names";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  questionnaireBlocks,
  questionnaireBlockTranslations,
  questionnaireChoiceTranslations,
  questionnaireFieldChoices,
  questionnaireFields,
  questionnaireFieldTranslations,
} from "@invessiv/db/record-configuration";
import { questionnaireDefinitionReadService as readService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";
import type {
  QuestionnaireBlockOwner,
  QuestionnaireBlockRow,
} from "@/server/shared/services/questionnaire/questionnaire-definition-types";
import { questionnaireMappingService } from "@/server/shared/services/questionnaire/questionnaire-mapping-service";
import { positionService } from "@/server/shared/services/position-service";
import { questionnaireDefinitionValidation } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-definition-validation";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import { versionConflict } from "@/server/workspace/shared/version-conflict";

type BlockResult = QuestionnaireCommandResult<QuestionnaireBlockDto>;
type OpenedBlock =
  | { ok: true; block: QuestionnaireBlockDto }
  | { ok: false; result: BlockResult };

const BLOCK_NOT_FOUND = {
  ok: false,
  code: QuestionnaireErrorCode.BlockNotFound,
} as const;
const FIELD_NOT_FOUND = {
  ok: false,
  code: QuestionnaireErrorCode.FieldNotFound,
} as const;

/** Every write on a block and its fields holds this lock, so invariants are checked on a stable block. */
async function lockBlock(
  tx: ContactDatabaseTransaction,
  blockId: string,
  owner: QuestionnaireBlockOwner,
): Promise<QuestionnaireBlockRow | null> {
  const [row] = await tx
    .select()
    .from(questionnaireBlocks)
    .where(
      and(
        eq(questionnaireBlocks.id, blockId),
        readService.ownerCondition(owner),
      ),
    )
    .limit(1)
    .for("update");
  return row ?? null;
}

function blockConflict(block: QuestionnaireBlockDto): BlockResult {
  return versionConflict(block.version, block);
}

/** Locks and loads the block; a stale version answers with the current block for the editor. */
async function openBlock(
  tx: ContactDatabaseTransaction,
  blockId: string,
  owner: QuestionnaireBlockOwner,
  expectedVersion: number,
): Promise<OpenedBlock> {
  if (!(await lockBlock(tx, blockId, owner)))
    return { ok: false, result: BLOCK_NOT_FOUND };
  const block = (await readService.findBlock(tx, blockId, owner))!;
  if (block.version !== expectedVersion)
    return { ok: false, result: blockConflict(block) };
  return { ok: true, block };
}

/** The block version is the one counter the editor compares; every write on the block bumps it. */
async function finishBlock(
  tx: ContactDatabaseTransaction,
  block: QuestionnaireBlockDto,
  owner: QuestionnaireBlockOwner,
  patch: Partial<
    Pick<QuestionnaireBlockRow, "key" | "carry_over" | "status">
  > = {},
): Promise<BlockResult> {
  await updateLockedVersioned(
    {
      tx,
      table: questionnaireBlocks,
      id: block.id,
      expectedVersion: block.version,
      patch,
    },
    "Questionnaire block changed while it was locked",
  );
  return {
    ok: true,
    value: (await readService.findBlock(tx, block.id, owner))!,
  };
}

/** Rebuilds the block with one level replaced; the level is the block or one group's children. */
function withSiblings(
  block: QuestionnaireBlockDto,
  parentFieldId: string | null,
  siblings: QuestionnaireFieldDto[],
): QuestionnaireBlockDto {
  if (parentFieldId === null) return { ...block, fields: siblings };
  return {
    ...block,
    fields: block.fields.map((field) =>
      field.id === parentFieldId ? { ...field, children: siblings } : field,
    ),
  };
}

/** Options keep their id (and so the conditions on them) as long as their key stays. */
function toChoices(
  input: QuestionnaireFieldInputDto["choices"],
  existing: readonly QuestionnaireChoiceDto[],
): QuestionnaireChoiceDto[] {
  const byKey = new Map(existing.map((choice) => [choice.key, choice]));
  return input.map((choice, position) => {
    const stored = byKey.get(choice.key);
    return {
      id: stored?.id ?? crypto.randomUUID(),
      key: choice.key,
      position,
      labels: choice.labels,
      version: stored?.version ?? 1,
    };
  });
}

function toField(
  input: QuestionnaireFieldInputDto,
  base: Pick<
    QuestionnaireFieldDto,
    "id" | "blockId" | "parentFieldId" | "position" | "children" | "version"
  > & {
    type: QuestionnaireFieldType;
    choices: readonly QuestionnaireChoiceDto[];
  },
): QuestionnaireFieldDto {
  return {
    id: base.id,
    blockId: base.blockId,
    parentFieldId: base.parentFieldId,
    key: input.key,
    position: base.position,
    type: base.type,
    requirement: input.requirement,
    maxLength: input.maxLength,
    minItems: input.minItems,
    maxItems: input.maxItems,
    acceptedAssetKinds: input.acceptedAssetKinds,
    prefillSource: input.prefillSource,
    conditionFieldId: input.conditionFieldId,
    conditionChoiceId: input.conditionChoiceId,
    translations: input.translations,
    choices: toChoices(input.choices, base.choices),
    children: base.children,
    version: base.version,
  };
}

async function insertChoices(
  tx: ContactDatabaseTransaction,
  fieldId: string,
  choices: readonly QuestionnaireChoiceDto[],
): Promise<void> {
  if (choices.length === 0) return;
  await tx
    .insert(questionnaireFieldChoices)
    .values(
      choices.map((choice) =>
        questionnaireMappingService.mapChoiceDtoToRow(fieldId, choice),
      ),
    );
}

async function insertTexts(
  tx: ContactDatabaseTransaction,
  field: QuestionnaireFieldDto,
  choices: readonly QuestionnaireChoiceDto[],
): Promise<void> {
  const fieldRows = questionnaireMappingService.mapFieldTranslationsToRows(
    field.id,
    field.translations,
  );
  if (fieldRows.length > 0)
    await tx.insert(questionnaireFieldTranslations).values(fieldRows);
  const choiceRows = choices.flatMap((choice) =>
    questionnaireMappingService.mapChoiceLabelsToRows(choice.id, choice.labels),
  );
  if (choiceRows.length > 0)
    await tx.insert(questionnaireChoiceTranslations).values(choiceRows);
}

/**
 * Brings the stored options in line with the field: unknown keys are inserted, missing ones
 * deleted, kept ones repositioned. Swapped positions would trip the unique index row by row, so it
 * is checked once at the end. Options carry no `updated_at` and are written only as part of their
 * field, whose version this write bumps.
 */
async function replaceChoices(
  tx: ContactDatabaseTransaction,
  before: QuestionnaireFieldDto,
  after: QuestionnaireFieldDto,
): Promise<void> {
  const kept = new Set(after.choices.map((choice) => choice.id));
  const removed = before.choices.filter((choice) => !kept.has(choice.id));
  if (removed.length > 0)
    await tx.delete(questionnaireFieldChoices).where(
      inArray(
        questionnaireFieldChoices.id,
        removed.map((choice) => choice.id),
      ),
    );

  const stored = new Map(before.choices.map((choice) => [choice.id, choice]));
  await positionService.withDeferredPositions(
    tx,
    QuestionnaireFieldChoicesConstraintName.PositionUnique,
    async () => {
      for (const choice of after.choices) {
        const previous = stored.get(choice.id);
        if (previous && previous.position !== choice.position)
          await tx
            .update(questionnaireFieldChoices)
            .set({ position: choice.position })
            .where(eq(questionnaireFieldChoices.id, choice.id));
      }
      await insertChoices(
        tx,
        after.id,
        after.choices.filter((choice) => !stored.has(choice.id)),
      );
    },
  );

  const keptIds = after.choices
    .filter((choice) => stored.has(choice.id))
    .map((choice) => choice.id);
  if (keptIds.length > 0)
    await tx
      .delete(questionnaireChoiceTranslations)
      .where(inArray(questionnaireChoiceTranslations.choice_id, keptIds));
}

function invalid(
  code: NonNullable<
    ReturnType<typeof questionnaireDefinitionValidation.validateBlock>
  >,
): BlockResult {
  return { ok: false, code };
}

/** An empty, active block of `owner`; its fields are added afterwards. */
async function createBlock(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  input: CreateQuestionnaireBlockRequestDto,
): Promise<BlockResult> {
  const texts = Object.entries(input.translations);
  if (texts.length === 0)
    return invalid(QuestionnaireErrorCode.TranslationRequired);
  if (await readService.isBlockKeyTaken(tx, owner, input.key))
    return invalid(QuestionnaireErrorCode.KeyTaken);

  const id = crypto.randomUUID();
  await tx.insert(questionnaireBlocks).values({
    id,
    owner_form_id: owner,
    source_block_id: null,
    key: input.key,
    carry_over: input.carryOver,
    status: QuestionnaireCatalogStatus.Active,
    version: 1,
  });
  await tx
    .insert(questionnaireBlockTranslations)
    .values(
      questionnaireMappingService.mapBlockTranslationsToRows(
        id,
        input.translations,
      ),
    );
  return { ok: true, value: (await readService.findBlock(tx, id, owner))! };
}

/**
 * Removes a block of `owner` for good and answers with it as it was. A block that a template
 * still lists answers `BLOCK_IN_USE`; only catalog blocks can be listed, so that never applies to
 * the blocks of a form.
 */
async function deleteBlock(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  blockId: string,
  expectedVersion: number,
): Promise<BlockResult> {
  const opened = await openBlock(tx, blockId, owner, expectedVersion);
  if (!opened.ok) return opened.result;
  if ((await readService.countTemplateUsage(tx, [blockId])).has(blockId))
    return { ok: false, code: QuestionnaireErrorCode.BlockInUse };

  await tx
    .delete(questionnaireBlocks)
    .where(eq(questionnaireBlocks.id, blockId));
  return { ok: true, value: opened.block };
}

/** Blocks of a form are never archived, so their status is not taken from the request. */
async function updateBlock(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  blockId: string,
  input: UpdateQuestionnaireBlockRequestDto,
): Promise<BlockResult> {
  const opened = await openBlock(tx, blockId, owner, input.version);
  if (!opened.ok) return opened.result;
  if (
    input.key !== opened.block.key &&
    (await readService.isBlockKeyTaken(tx, owner, input.key))
  )
    return invalid(QuestionnaireErrorCode.KeyTaken);
  const next = { ...opened.block, translations: input.translations };
  const code = questionnaireDefinitionValidation.validateBlock(next);
  if (code) return invalid(code);

  await tx
    .delete(questionnaireBlockTranslations)
    .where(eq(questionnaireBlockTranslations.block_id, blockId));
  await tx
    .insert(questionnaireBlockTranslations)
    .values(
      questionnaireMappingService.mapBlockTranslationsToRows(
        blockId,
        input.translations,
      ),
    );
  return finishBlock(tx, opened.block, owner, {
    key: input.key,
    carry_over: input.carryOver,
    status: owner === null ? input.status : QuestionnaireCatalogStatus.Active,
  });
}

async function createField(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  blockId: string,
  input: QuestionnaireFieldInputDto & {
    type: QuestionnaireFieldType;
    parentFieldId: string | null;
    expectedBlockVersion: number;
  },
): Promise<BlockResult> {
  const opened = await openBlock(
    tx,
    blockId,
    owner,
    input.expectedBlockVersion,
  );
  if (!opened.ok) return opened.result;
  const { block } = opened;
  // A sub-field only goes below a group of the same block; the validation rejects other types.
  if (
    input.parentFieldId !== null &&
    !block.fields.some((field) => field.id === input.parentFieldId)
  )
    return FIELD_NOT_FOUND;

  const siblings = questionnaireFieldLevel(block, input.parentFieldId);
  const field = toField(input, {
    id: crypto.randomUUID(),
    blockId,
    parentFieldId: input.parentFieldId,
    position: siblings.length,
    type: input.type,
    choices: [],
    children: [],
    version: 1,
  });
  const code = questionnaireDefinitionValidation.validateBlock(
    withSiblings(block, input.parentFieldId, [...siblings, field]),
  );
  if (code) return invalid(code);

  await tx.insert(questionnaireFields).values({
    id: field.id,
    block_id: blockId,
    parent_field_id: field.parentFieldId,
    position: field.position,
    type: field.type,
    version: field.version,
    ...questionnaireMappingService.mapFieldDtoToColumns(field),
  });
  await insertChoices(tx, field.id, field.choices);
  await insertTexts(tx, field, field.choices);
  return finishBlock(tx, block, owner);
}

async function updateField(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  fieldId: string,
  input: QuestionnaireFieldInputDto & { expectedBlockVersion: number },
): Promise<BlockResult> {
  const blockId = await readService.findFieldBlockId(tx, fieldId, owner);
  if (!blockId) return FIELD_NOT_FOUND;
  const opened = await openBlock(
    tx,
    blockId,
    owner,
    input.expectedBlockVersion,
  );
  if (!opened.ok) return opened.result;
  const { block } = opened;
  const before = findField(block, fieldId);
  if (!before) return FIELD_NOT_FOUND;

  const after = toField(input, before);
  const siblings = questionnaireFieldLevel(block, before.parentFieldId).map(
    (field) => (field.id === fieldId ? after : field),
  );
  const code = questionnaireDefinitionValidation.validateBlock(
    withSiblings(block, before.parentFieldId, siblings),
  );
  if (code) return invalid(code);

  await replaceChoices(tx, before, after);
  await updateLockedVersioned(
    {
      tx,
      table: questionnaireFields,
      id: fieldId,
      expectedVersion: before.version,
      patch: questionnaireMappingService.mapFieldDtoToColumns(after),
    },
    "Questionnaire field changed while its block was locked",
  );
  await tx
    .delete(questionnaireFieldTranslations)
    .where(eq(questionnaireFieldTranslations.field_id, fieldId));
  await insertTexts(tx, after, after.choices);
  return finishBlock(tx, block, owner);
}

/** Closes the gap a removed field leaves, so positions stay dense and below the stored ceiling. */
async function compactPositions(
  tx: ContactDatabaseTransaction,
  siblings: readonly QuestionnaireFieldDto[],
): Promise<void> {
  for (const [position, field] of siblings.entries()) {
    if (field.position === position) continue;
    await updateLockedVersioned(
      {
        tx,
        table: questionnaireFields,
        id: field.id,
        expectedVersion: field.version,
        patch: { position },
      },
      "Questionnaire field changed while its block was locked",
    );
  }
}

/**
 * `keepLevelFilled` refuses to remove the last field of a block or the last sub-field of a group.
 * An owner whose blocks someone already fills in passes it, so no step ends up asking nothing.
 */
async function deleteField(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  fieldId: string,
  expectedBlockVersion: number,
  options: { keepLevelFilled?: boolean } = {},
): Promise<BlockResult> {
  const blockId = await readService.findFieldBlockId(tx, fieldId, owner);
  if (!blockId) return FIELD_NOT_FOUND;
  const opened = await openBlock(tx, blockId, owner, expectedBlockVersion);
  if (!opened.ok) return opened.result;
  const { block } = opened;
  const field = findField(block, fieldId);
  if (!field) return FIELD_NOT_FOUND;

  // A field that still triggers another one stays; its dependent would silently become unconditional.
  const remaining = questionnaireFieldLevel(block, field.parentFieldId).filter(
    (sibling) => sibling.id !== fieldId,
  );
  if (options.keepLevelFilled && remaining.length === 0)
    return invalid(QuestionnaireErrorCode.LastField);
  const code = questionnaireDefinitionValidation.validateBlock(
    withSiblings(block, field.parentFieldId, remaining),
  );
  if (code) return invalid(code);

  await tx
    .delete(questionnaireFields)
    .where(eq(questionnaireFields.id, fieldId));
  await compactPositions(tx, remaining);
  return finishBlock(tx, block, owner);
}

/** Swaps two neighbours in one transaction; the unique position index is checked at commit. */
async function moveField(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  fieldId: string,
  direction: -1 | 1,
  expectedBlockVersion: number,
): Promise<BlockResult> {
  const blockId = await readService.findFieldBlockId(tx, fieldId, owner);
  if (!blockId) return FIELD_NOT_FOUND;
  const opened = await openBlock(tx, blockId, owner, expectedBlockVersion);
  if (!opened.ok) return opened.result;
  const { block } = opened;
  const field = findField(block, fieldId);
  if (!field) return FIELD_NOT_FOUND;

  const siblings = questionnaireFieldLevel(block, field.parentFieldId);
  const index = siblings.findIndex((sibling) => sibling.id === fieldId);
  const neighbour = siblings[index + direction];
  if (!neighbour) return { ok: true, value: block };

  const reordered = moveListItem(siblings, index, direction).map(
    (sibling, position) => ({ ...sibling, position }),
  );
  const code = questionnaireDefinitionValidation.validateBlock(
    withSiblings(block, field.parentFieldId, reordered),
  );
  if (code) return invalid(code);

  await positionService.withDeferredPositions(
    tx,
    QuestionnaireFieldsConstraintName.PositionUnique,
    async () => {
      for (const [moved, position] of [
        [field, neighbour.position],
        [neighbour, field.position],
      ] as const)
        await updateLockedVersioned(
          {
            tx,
            table: questionnaireFields,
            id: moved.id,
            expectedVersion: moved.version,
            patch: { position },
          },
          "Questionnaire field changed while its block was locked",
        );
    },
  );
  return finishBlock(tx, block, owner);
}

export const questionnaireDefinitionWriteService = {
  blockConflict,
  createBlock,
  createField,
  deleteBlock,
  deleteField,
  lockBlock,
  moveField,
  updateBlock,
  updateField,
} as const;
