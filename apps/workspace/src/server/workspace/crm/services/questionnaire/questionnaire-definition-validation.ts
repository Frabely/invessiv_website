import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import {
  QUESTIONNAIRE_CHOICE_FIELD_TYPE_VALUES,
  QUESTIONNAIRE_CONDITION_TRIGGER_TYPE_VALUES,
  QUESTIONNAIRE_GROUP_CHILD_EXCLUDED_TYPE_VALUES,
  QUESTIONNAIRE_ITEM_COUNT_FIELD_TYPE_VALUES,
  QUESTIONNAIRE_LENGTH_LIMITED_FIELD_TYPE_VALUES,
  QuestionnaireFieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS as L } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { QUESTIONNAIRE_PREFILL_SOURCE_FIELD_TYPES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-prefill-sources";
import { QUESTIONNAIRE_SCALE_CHOICE_KEY_VALUES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-scale-choice-keys";
import { QUESTIONNAIRE_YES_NO_CHOICE_KEY_VALUES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-yes-no-choice-keys";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import { flattenQuestionnaireFields } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { sameSequence } from "@invessiv/common/patterns/collections/same-sequence";

type ValidationCode = Exclude<
  QuestionnaireErrorCode,
  | typeof QuestionnaireErrorCode.ValidationError
  | typeof QuestionnaireErrorCode.Internal
>;

const FIXED_CHOICE_KEYS: Partial<
  Record<QuestionnaireFieldType, readonly string[]>
> = {
  [QuestionnaireFieldType.YesNo]: QUESTIONNAIRE_YES_NO_CHOICE_KEY_VALUES,
  [QuestionnaireFieldType.Scale]: QUESTIONNAIRE_SCALE_CHOICE_KEY_VALUES,
};

const MAX_ITEMS_BY_TYPE: Partial<Record<QuestionnaireFieldType, number>> = {
  [QuestionnaireFieldType.Files]: L.filesPerField,
  [QuestionnaireFieldType.Group]: L.groupEntriesPerField,
  [QuestionnaireFieldType.MultiChoice]: L.choicesPerField,
};

function includes(values: readonly string[], value: string): boolean {
  return values.includes(value);
}

function hasText(record: object): boolean {
  return Object.keys(record).length > 0;
}

function checkStructure(
  field: QuestionnaireFieldDto,
  parent: QuestionnaireFieldDto | null,
): ValidationCode | null {
  if (
    parent &&
    includes(QUESTIONNAIRE_GROUP_CHILD_EXCLUDED_TYPE_VALUES, field.type)
  )
    return QuestionnaireErrorCode.InvalidFieldConfig;
  if (field.type !== QuestionnaireFieldType.Group && field.children.length > 0)
    return QuestionnaireErrorCode.InvalidFieldConfig;
  if (field.children.length > L.childFieldsPerGroup)
    return QuestionnaireErrorCode.LimitReached;
  return null;
}

function checkConfig(field: QuestionnaireFieldDto): ValidationCode | null {
  const { maxLength, minItems, maxItems } = field;
  if (
    maxLength !== null &&
    !includes(QUESTIONNAIRE_LENGTH_LIMITED_FIELD_TYPE_VALUES, field.type)
  )
    return QuestionnaireErrorCode.InvalidFieldConfig;
  if (
    (minItems !== null || maxItems !== null) &&
    !includes(QUESTIONNAIRE_ITEM_COUNT_FIELD_TYPE_VALUES, field.type)
  )
    return QuestionnaireErrorCode.InvalidFieldConfig;
  if (minItems !== null && maxItems !== null && minItems > maxItems)
    return QuestionnaireErrorCode.InvalidFieldConfig;
  if (
    field.acceptedAssetKinds !== null &&
    field.type !== QuestionnaireFieldType.Files
  )
    return QuestionnaireErrorCode.InvalidFieldConfig;
  if (
    field.prefillSource !== null &&
    QUESTIONNAIRE_PREFILL_SOURCE_FIELD_TYPES[field.prefillSource] !== field.type
  )
    return QuestionnaireErrorCode.InvalidFieldConfig;
  // A multi choice cannot demand more ticks than it has options.
  if (
    field.type === QuestionnaireFieldType.MultiChoice &&
    Math.max(minItems ?? 0, maxItems ?? 0) > field.choices.length
  )
    return QuestionnaireErrorCode.InvalidFieldConfig;
  const ceiling = MAX_ITEMS_BY_TYPE[field.type];
  if (ceiling !== undefined && Math.max(minItems ?? 0, maxItems ?? 0) > ceiling)
    return QuestionnaireErrorCode.LimitReached;
  return null;
}

function checkChoices(field: QuestionnaireFieldDto): ValidationCode | null {
  const keys = field.choices.map((choice) => choice.key);
  if (!includes(QUESTIONNAIRE_CHOICE_FIELD_TYPE_VALUES, field.type))
    return keys.length === 0 ? null : QuestionnaireErrorCode.InvalidFieldConfig;
  if (keys.length > L.choicesPerField)
    return QuestionnaireErrorCode.LimitReached;
  const fixed = FIXED_CHOICE_KEYS[field.type];
  if (fixed ? !sameSequence(keys, fixed) : keys.length < 2)
    return QuestionnaireErrorCode.InvalidFieldConfig;
  if (new Set(keys).size !== keys.length)
    return QuestionnaireErrorCode.InvalidFieldConfig;
  if (field.choices.some((choice) => !hasText(choice.labels)))
    return QuestionnaireErrorCode.TranslationRequired;
  return null;
}

/** A trigger sits on the same level with a lower position, so the portal shows it first. */
function checkCondition(
  field: QuestionnaireFieldDto,
  siblings: readonly QuestionnaireFieldDto[],
): ValidationCode | null {
  if ((field.conditionFieldId === null) !== (field.conditionChoiceId === null))
    return QuestionnaireErrorCode.InvalidCondition;
  if (field.conditionFieldId === null) return null;
  const trigger = siblings.find(
    (sibling) => sibling.id === field.conditionFieldId,
  );
  if (
    !trigger ||
    trigger.position >= field.position ||
    !includes(QUESTIONNAIRE_CONDITION_TRIGGER_TYPE_VALUES, trigger.type) ||
    !trigger.choices.some((choice) => choice.id === field.conditionChoiceId)
  )
    return QuestionnaireErrorCode.InvalidCondition;
  return null;
}

function checkField(
  field: QuestionnaireFieldDto,
  parent: QuestionnaireFieldDto | null,
  siblings: readonly QuestionnaireFieldDto[],
): ValidationCode | null {
  return (
    checkStructure(field, parent) ??
    checkConfig(field) ??
    (hasText(field.translations)
      ? null
      : QuestionnaireErrorCode.TranslationRequired) ??
    checkChoices(field) ??
    checkCondition(field, siblings)
  );
}

/**
 * Checks a block as it would be after a write, so every command validates the same way: a
 * removed option or field that still triggers a condition, or a trigger moved behind its
 * dependent field, surfaces as a dangling condition.
 */
function validateBlock(block: QuestionnaireBlockDto): ValidationCode | null {
  if (!hasText(block.translations))
    return QuestionnaireErrorCode.TranslationRequired;
  const fields = flattenQuestionnaireFields(block.fields);
  if (fields.length > L.fieldsPerBlock)
    return QuestionnaireErrorCode.LimitReached;
  if (new Set(fields.map((field) => field.key)).size !== fields.length)
    return QuestionnaireErrorCode.KeyTaken;
  if (
    fields.filter(
      (field) => field.type === QuestionnaireFieldType.ProjectServices,
    ).length > 1
  )
    return QuestionnaireErrorCode.InvalidFieldConfig;

  for (const field of block.fields) {
    const code =
      checkField(field, null, block.fields) ??
      field.children
        .map((child) => checkField(child, field, field.children))
        .find((childCode) => childCode !== null) ??
      null;
    if (code) return code;
  }
  return null;
}

export const questionnaireDefinitionValidation = { validateBlock } as const;
