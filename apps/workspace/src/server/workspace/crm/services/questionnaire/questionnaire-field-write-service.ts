import "server-only";

import { eq } from "drizzle-orm";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireFieldInputDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field-input.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import { moveListItem } from "@invessiv/common/patterns/collections/ordered-list";
import {
  findQuestionnaireField as findField,
  questionnaireFieldLevel,
} from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { questionnaireDefinitionValidation } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-definition-validation";
import { QuestionnaireFieldsConstraintName } from "@invessiv/db/constraint-names/crm/questionnaire-fields-constraint-names";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  questionnaireFields,
  questionnaireFieldTranslations,
} from "@invessiv/db/record-configuration";
import { positionService } from "@/server/shared/services/position-service";
import type { QuestionnaireBlockOwner } from "@/server/shared/services/questionnaire/questionnaire-definition-types";
import { questionnaireMappingService } from "@/server/shared/services/questionnaire/questionnaire-mapping-service";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import { questionnaireBlockSession as session } from "./questionnaire-block-session";
import { questionnaireFieldPersistenceService as persistence } from "./questionnaire-field-persistence-service";
import type { QuestionnaireBlockResult } from "./questionnaire-write-types";

const FIELD_WRITE_FAILURE =
  "Questionnaire field changed while its block was locked";

async function createField(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  blockId: string,
  input: QuestionnaireFieldInputDto & {
    type: QuestionnaireFieldType;
    parentFieldId: string | null;
    expectedBlockVersion: number;
  },
): Promise<QuestionnaireBlockResult> {
  const opened = await session.openBlock(
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
    return session.FIELD_NOT_FOUND;

  const siblings = questionnaireFieldLevel(block, input.parentFieldId);
  const field = persistence.toField(input, {
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
    session.withSiblings(block, input.parentFieldId, [...siblings, field]),
  );
  if (code) return session.invalid(code);

  await tx.insert(questionnaireFields).values({
    id: field.id,
    block_id: blockId,
    parent_field_id: field.parentFieldId,
    position: field.position,
    type: field.type,
    version: field.version,
    ...questionnaireMappingService.mapFieldDtoToColumns(field),
  });
  await persistence.insertChoices(tx, field.id, field.choices);
  await persistence.insertTexts(tx, field, field.choices);
  return session.finishBlock(tx, block, owner);
}

async function updateField(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  fieldId: string,
  input: QuestionnaireFieldInputDto & { expectedBlockVersion: number },
): Promise<QuestionnaireBlockResult> {
  const opened = await session.openBlockOfField(
    tx,
    fieldId,
    owner,
    input.expectedBlockVersion,
  );
  if (!opened.ok) return opened.result;
  const { block } = opened;
  const before = findField(block, fieldId);
  if (!before) return session.FIELD_NOT_FOUND;

  const after = persistence.toField(input, before);
  const siblings = questionnaireFieldLevel(block, before.parentFieldId).map(
    (field) => (field.id === fieldId ? after : field),
  );
  const code = questionnaireDefinitionValidation.validateBlock(
    session.withSiblings(block, before.parentFieldId, siblings),
  );
  if (code) return session.invalid(code);

  await persistence.replaceChoices(tx, before, after);
  await updateLockedVersioned(
    {
      tx,
      table: questionnaireFields,
      id: fieldId,
      expectedVersion: before.version,
      patch: questionnaireMappingService.mapFieldDtoToColumns(after),
    },
    FIELD_WRITE_FAILURE,
  );
  await tx
    .delete(questionnaireFieldTranslations)
    .where(eq(questionnaireFieldTranslations.field_id, fieldId));
  await persistence.insertTexts(tx, after, after.choices);
  return session.finishBlock(tx, block, owner);
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
      FIELD_WRITE_FAILURE,
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
): Promise<QuestionnaireBlockResult> {
  const opened = await session.openBlockOfField(
    tx,
    fieldId,
    owner,
    expectedBlockVersion,
  );
  if (!opened.ok) return opened.result;
  const { block } = opened;
  const field = findField(block, fieldId);
  if (!field) return session.FIELD_NOT_FOUND;

  // A field that still triggers another one stays; its dependent would silently become unconditional.
  const remaining = questionnaireFieldLevel(block, field.parentFieldId).filter(
    (sibling) => sibling.id !== fieldId,
  );
  if (options.keepLevelFilled && remaining.length === 0)
    return session.invalid(QuestionnaireErrorCode.LastField);
  const code = questionnaireDefinitionValidation.validateBlock(
    session.withSiblings(block, field.parentFieldId, remaining),
  );
  if (code) return session.invalid(code);

  await tx
    .delete(questionnaireFields)
    .where(eq(questionnaireFields.id, fieldId));
  await compactPositions(tx, remaining);
  return session.finishBlock(tx, block, owner);
}

/** Swaps two neighbours in one transaction; the unique position index is checked at commit. */
async function moveField(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  fieldId: string,
  direction: -1 | 1,
  expectedBlockVersion: number,
): Promise<QuestionnaireBlockResult> {
  const opened = await session.openBlockOfField(
    tx,
    fieldId,
    owner,
    expectedBlockVersion,
  );
  if (!opened.ok) return opened.result;
  const { block } = opened;
  const field = findField(block, fieldId);
  if (!field) return session.FIELD_NOT_FOUND;

  const siblings = questionnaireFieldLevel(block, field.parentFieldId);
  const index = siblings.findIndex((sibling) => sibling.id === fieldId);
  const neighbour = siblings[index + direction];
  if (!neighbour) return { ok: true, value: block };

  const reordered = moveListItem(siblings, index, direction).map(
    (sibling, position) => ({ ...sibling, position }),
  );
  const code = questionnaireDefinitionValidation.validateBlock(
    session.withSiblings(block, field.parentFieldId, reordered),
  );
  if (code) return session.invalid(code);

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
          FIELD_WRITE_FAILURE,
        );
    },
  );
  return session.finishBlock(tx, block, owner);
}

export const questionnaireFieldWriteService = {
  createField,
  deleteField,
  moveField,
  updateField,
} as const;
