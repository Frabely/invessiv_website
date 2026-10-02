import type { Locale } from "@invessiv/common";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import type { QuestionnaireBlockTranslationDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-translation.dto";
import type { QuestionnaireChoiceDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-choice.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { QuestionnaireFieldTranslationDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field-translation.dto";
import type { QuestionnaireTemplateDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template.dto";
import type { QuestionnaireTemplateSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template-summary.dto";
import { compareByPosition } from "@invessiv/common/patterns/collections/compare-by-position";
import { groupBy } from "@invessiv/common/patterns/collections/group-by";
import { missingQuestionnaireLocales } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import type {
  QuestionnaireChoiceRow,
  QuestionnaireDefinitionRows,
  QuestionnaireFieldRow,
  QuestionnaireTemplateRow,
} from "@/server/shared/services/questionnaire/questionnaire-definition-types";

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
        .sort(compareByPosition)
        .map((choice) => toChoiceDto(choice, choiceLabels)),
      children: (childrenByParent.get(row.id) ?? [])
        .sort(compareByPosition)
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
      .sort(compareByPosition)
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
      .sort(compareByPosition)
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

/** Columns a field has besides its identity and place; the caller adds id, block and position. */
function mapFieldDtoToColumns(
  field: Pick<
    QuestionnaireFieldDto,
    | "key"
    | "requirement"
    | "maxLength"
    | "minItems"
    | "maxItems"
    | "acceptedAssetKinds"
    | "prefillSource"
    | "conditionFieldId"
    | "conditionChoiceId"
  >,
) {
  return {
    key: field.key,
    requirement: field.requirement,
    max_length: field.maxLength,
    min_items: field.minItems,
    max_items: field.maxItems,
    accepted_asset_kinds: field.acceptedAssetKinds,
    prefill_source: field.prefillSource,
    condition_field_id: field.conditionFieldId,
    condition_choice_id: field.conditionChoiceId,
  };
}

function mapChoiceDtoToRow(
  fieldId: string,
  choice: Pick<QuestionnaireChoiceDto, "id" | "key" | "position" | "version">,
) {
  return {
    id: choice.id,
    field_id: fieldId,
    key: choice.key,
    position: choice.position,
    version: choice.version,
  };
}

function mapBlockTranslationsToRows(
  blockId: string,
  translations: QuestionnaireBlockDto["translations"],
) {
  return Object.entries(translations).map(([locale, text]) => ({
    block_id: blockId,
    locale: locale as Locale,
    title: text.title,
    intro: text.intro,
  }));
}

function mapFieldTranslationsToRows(
  fieldId: string,
  translations: QuestionnaireFieldDto["translations"],
) {
  return Object.entries(translations).map(([locale, text]) => ({
    field_id: fieldId,
    locale: locale as Locale,
    label: text.label,
    help: text.help,
  }));
}

function mapChoiceLabelsToRows(
  choiceId: string,
  labels: QuestionnaireChoiceDto["labels"],
) {
  return Object.entries(labels).map(([locale, label]) => ({
    choice_id: choiceId,
    locale: locale as Locale,
    label,
  }));
}

export const questionnaireMappingService = {
  mapBlockTranslationsToRows,
  mapChoiceDtoToRow,
  mapChoiceLabelsToRows,
  mapFieldDtoToColumns,
  mapFieldTranslationsToRows,
  toBlockDtos,
  toBlockSummaryDto,
  toTemplateDto,
  toTemplateSummaryDto,
} as const;
