import "server-only";

import { eq, inArray } from "drizzle-orm";

import type { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireChoiceDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-choice.dto";
import type { QuestionnaireFieldInputDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field-input.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import { QuestionnaireFieldChoicesConstraintName } from "@invessiv/db/constraint-names/crm/questionnaire-field-choices-constraint-names";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  questionnaireChoiceTranslations,
  questionnaireFieldChoices,
  questionnaireFieldTranslations,
} from "@invessiv/db/record-configuration";
import { positionService } from "@/server/shared/services/position-service";
import { questionnaireMappingService } from "@/server/shared/services/questionnaire/questionnaire-mapping-service";

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

/** The field as it will be once the request is applied; the validation runs on this, not on rows. */
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

/** Writes the texts of a field and of its options; the caller has removed the old rows. */
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

export const questionnaireFieldPersistenceService = {
  insertChoices,
  insertTexts,
  replaceChoices,
  toField,
} as const;
