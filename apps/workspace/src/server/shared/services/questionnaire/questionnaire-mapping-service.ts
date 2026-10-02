import type { Locale } from "@invessiv/common";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import type { QuestionnaireBlockTranslationDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-translation.dto";
import type { QuestionnaireChoiceDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-choice.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { QuestionnaireFieldTranslationDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field-translation.dto";
import type { QuestionnaireTemplateDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template.dto";
import type { QuestionnaireTemplateSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template-summary.dto";
import { missingQuestionnaireLocales } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import type {
  QuestionnaireChoiceRow,
  QuestionnaireDefinitionRows,
  QuestionnaireFieldRow,
  QuestionnaireTemplateRow,
} from "@/server/shared/services/questionnaire/questionnaire-definition-types";

function groupBy<T>(rows: readonly T[], keyOf: (row: T) => string) {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return groups;
}

function byPosition(left: { position: number }, right: { position: number }) {
  return left.position - right.position;
}

function toChoiceDto(
  row: QuestionnaireChoiceRow,
  labels: Map<string, Partial<Record<Locale, string>>>,
): QuestionnaireChoiceDto {
  return {
    id: row.id,
    key: row.key,
    position: row.position,
    labels: labels.get(row.id) ?? {},
    version: row.version,
  };
}

/**
 * Turns the rows of `questionnaireDefinitionReadService.loadRows` into block DTOs, keeping the
 * block order of the rows. Fields, sub-fields and options are sorted by position.
 */
function toBlockDtos(
  rows: QuestionnaireDefinitionRows,
): QuestionnaireBlockDto[] {
  const blockTexts = new Map<
    string,
    Partial<Record<Locale, QuestionnaireBlockTranslationDto>>
  >();
  for (const row of rows.blockTranslations)
    blockTexts.set(row.block_id, {
      ...blockTexts.get(row.block_id),
      [row.locale]: { title: row.title, intro: row.intro },
    });

  const fieldTexts = new Map<
    string,
    Partial<Record<Locale, QuestionnaireFieldTranslationDto>>
  >();
  for (const row of rows.fieldTranslations)
    fieldTexts.set(row.field_id, {
      ...fieldTexts.get(row.field_id),
      [row.locale]: { label: row.label, help: row.help },
    });

  const choiceLabels = new Map<string, Partial<Record<Locale, string>>>();
  for (const row of rows.choiceTranslations)
    choiceLabels.set(row.choice_id, {
      ...choiceLabels.get(row.choice_id),
      [row.locale]: row.label,
    });

  const choicesByField = groupBy(rows.choices, (row) => row.field_id);
  const childrenByParent = groupBy(
    rows.fields.filter((row) => row.parent_field_id !== null),
    (row) => row.parent_field_id!,
  );
  const topFieldsByBlock = groupBy(
    rows.fields.filter((row) => row.parent_field_id === null),
    (row) => row.block_id,
  );

  function toFieldDto(row: QuestionnaireFieldRow): QuestionnaireFieldDto {
    return {
      id: row.id,
      blockId: row.block_id,
      parentFieldId: row.parent_field_id,
      key: row.key,
      position: row.position,
      type: row.type,
      requirement: row.requirement,
      maxLength: row.max_length,
      minItems: row.min_items,
      maxItems: row.max_items,
      acceptedAssetKinds: row.accepted_asset_kinds,
      prefillSource: row.prefill_source,
      conditionFieldId: row.condition_field_id,
      conditionChoiceId: row.condition_choice_id,
      translations: fieldTexts.get(row.id) ?? {},
      choices: (choicesByField.get(row.id) ?? [])
        .sort(byPosition)
        .map((choice) => toChoiceDto(choice, choiceLabels)),
      children: (childrenByParent.get(row.id) ?? [])
        .sort(byPosition)
        .map(toFieldDto),
      version: row.version,
    };
  }

  return rows.blocks.map((block) => ({
    id: block.id,
    key: block.key,
    carryOver: block.carry_over,
    status: block.status,
    sourceBlockId: block.source_block_id,
    translations: blockTexts.get(block.id) ?? {},
    fields: (topFieldsByBlock.get(block.id) ?? [])
      .sort(byPosition)
      .map(toFieldDto),
    version: block.version,
  }));
}

function toBlockSummaryDto(
  block: QuestionnaireBlockDto,
  templateCount: number,
): QuestionnaireBlockSummaryDto {
  const titles: Partial<Record<Locale, string>> = {};
  for (const [locale, text] of Object.entries(block.translations) as [
    Locale,
    QuestionnaireBlockTranslationDto,
  ][])
    titles[locale] = text.title;

  return {
    id: block.id,
    key: block.key,
    titles,
    carryOver: block.carryOver,
    status: block.status,
    fieldCount: block.fields.reduce(
      (count, field) => count + 1 + field.children.length,
      0,
    ),
    missingLocales: missingQuestionnaireLocales(block),
    templateCount,
  };
}

function toTemplateDto(
  row: QuestionnaireTemplateRow,
  blocks: readonly { block_id: string; position: number }[],
): QuestionnaireTemplateDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    blocks: [...blocks]
      .sort(byPosition)
      .map((block) => ({ blockId: block.block_id, position: block.position })),
    version: row.version,
  };
}

function toTemplateSummaryDto(
  row: QuestionnaireTemplateRow,
  blockCount: number,
): QuestionnaireTemplateSummaryDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    blockCount,
    updatedAt: row.updated_at.toISOString(),
  };
}

export const questionnaireMappingService = {
  toBlockDtos,
  toBlockSummaryDto,
  toTemplateDto,
  toTemplateSummaryDto,
} as const;
