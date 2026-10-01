import "server-only";

import type { Locale } from "@invessiv/common";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { flattenQuestionnaireFields } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  questionnaireBlocks,
  questionnaireBlockTranslations,
  questionnaireChoiceTranslations,
  questionnaireFieldChoices,
  questionnaireFields,
  questionnaireFieldTranslations,
} from "@invessiv/db/record-configuration";
import type { QuestionnaireBlockOwner } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-types";

type CopyTarget = {
  /** Null copies into the catalog, otherwise into that form. */
  ownerFormId: QuestionnaireBlockOwner;
  key: string;
};

/**
 * Insert round of each field: a condition needs its trigger and the trigger's options stored
 * first, and a sub-field is stored no earlier than its group. Fields of one round go into one
 * statement, where a group and its sub-fields may reference each other.
 */
function insertRounds(fields: readonly QuestionnaireFieldDto[]): number[] {
  const byId = new Map(fields.map((field) => [field.id, field]));
  const rounds = new Map<string, number>();
  function roundOf(field: QuestionnaireFieldDto): number {
    const known = rounds.get(field.id);
    if (known !== undefined) return known;
    const trigger = field.conditionFieldId
      ? byId.get(field.conditionFieldId)
      : undefined;
    const parent = field.parentFieldId
      ? byId.get(field.parentFieldId)
      : undefined;
    const round = Math.max(
      trigger ? roundOf(trigger) + 1 : 0,
      parent ? roundOf(parent) : 0,
    );
    rounds.set(field.id, round);
    return round;
  }
  return fields.map(roundOf);
}

/**
 * Deep copy of a block with new ids for the block, every field and every option; conditions and
 * groups point at the copies. Runs in the caller's transaction and returns the new block id.
 * A copy into a form remembers its catalog origin for the pre-fill; a catalog copy has none.
 */
async function copyBlock(
  tx: ContactDatabaseTransaction,
  source: QuestionnaireBlockDto,
  target: CopyTarget,
): Promise<string> {
  const blockId = crypto.randomUUID();
  const fields = flattenQuestionnaireFields(source.fields);
  const fieldIds = new Map(
    fields.map((field) => [field.id, crypto.randomUUID()]),
  );
  const choiceIds = new Map(
    fields.flatMap((field) =>
      field.choices.map((choice) => [choice.id, crypto.randomUUID()] as const),
    ),
  );
  const newId = (ids: Map<string, string>, id: string | null) =>
    id === null ? null : ids.get(id)!;

  await tx.insert(questionnaireBlocks).values({
    id: blockId,
    owner_form_id: target.ownerFormId,
    source_block_id:
      target.ownerFormId === null ? null : (source.sourceBlockId ?? source.id),
    key: target.key,
    carry_over: source.carryOver,
    status: QuestionnaireCatalogStatus.Active,
    version: 1,
  });
  const blockTexts = Object.entries(source.translations).map(
    ([locale, text]) => ({
      block_id: blockId,
      locale: locale as Locale,
      title: text.title,
      intro: text.intro,
    }),
  );
  if (blockTexts.length > 0)
    await tx.insert(questionnaireBlockTranslations).values(blockTexts);
  if (fields.length === 0) return blockId;

  const rounds = insertRounds(fields);
  for (let round = 0; round <= Math.max(...rounds); round += 1) {
    const batch = fields.filter((_, index) => rounds[index] === round);
    await tx.insert(questionnaireFields).values(
      batch.map((field) => ({
        id: fieldIds.get(field.id)!,
        block_id: blockId,
        parent_field_id: newId(fieldIds, field.parentFieldId),
        key: field.key,
        position: field.position,
        type: field.type,
        requirement: field.requirement,
        max_length: field.maxLength,
        min_items: field.minItems,
        max_items: field.maxItems,
        accepted_asset_kinds: field.acceptedAssetKinds,
        prefill_source: field.prefillSource,
        condition_field_id: newId(fieldIds, field.conditionFieldId),
        condition_choice_id: newId(choiceIds, field.conditionChoiceId),
        version: 1,
      })),
    );
    const choices = batch.flatMap((field) =>
      field.choices.map((choice) => ({
        id: choiceIds.get(choice.id)!,
        field_id: fieldIds.get(field.id)!,
        key: choice.key,
        position: choice.position,
        version: 1,
      })),
    );
    if (choices.length > 0)
      await tx.insert(questionnaireFieldChoices).values(choices);
  }

  const fieldTexts = fields.flatMap((field) =>
    Object.entries(field.translations).map(([locale, text]) => ({
      field_id: fieldIds.get(field.id)!,
      locale: locale as Locale,
      label: text.label,
      help: text.help,
    })),
  );
  if (fieldTexts.length > 0)
    await tx.insert(questionnaireFieldTranslations).values(fieldTexts);
  const choiceTexts = fields.flatMap((field) =>
    field.choices.flatMap((choice) =>
      Object.entries(choice.labels).map(([locale, label]) => ({
        choice_id: choiceIds.get(choice.id)!,
        locale: locale as Locale,
        label,
      })),
    ),
  );
  if (choiceTexts.length > 0)
    await tx.insert(questionnaireChoiceTranslations).values(choiceTexts);
  return blockId;
}

export const questionnaireBlockCopyService = { copyBlock } as const;
