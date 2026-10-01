import {
  SUPPORTED_LOCALES,
  type Locale,
} from "@invessiv/common/contracts/i18n/locale";
import {
  QUESTIONNAIRE_CHOICE_FIELD_TYPE_VALUES,
  QUESTIONNAIRE_ITEM_COUNT_FIELD_TYPE_VALUES,
  QUESTIONNAIRE_LENGTH_LIMITED_FIELD_TYPE_VALUES,
  QuestionnaireFieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import {
  QUESTIONNAIRE_CHOICE_KEY_PATTERN_SOURCE,
  QUESTIONNAIRE_KEY_PATTERN_SOURCE,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-key-patterns";
import {
  QUESTIONNAIRE_PREFILL_SOURCE_FIELD_TYPES,
  QUESTIONNAIRE_PREFILL_SOURCE_VALUES,
  type QuestionnairePrefillSource,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-prefill-sources";
import { QuestionnaireScaleChoiceKey } from "@invessiv/common/constants/crm/questionnaire/questionnaire-scale-choice-keys";
import { QuestionnaireYesNoChoiceKey } from "@invessiv/common/constants/crm/questionnaire/questionnaire-yes-no-choice-keys";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { QuestionnaireFieldInputDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field-input.dto";
import { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";
import type { QuestionnaireChoiceFormValues } from "@/common/contracts/crm/questionnaire/questionnaire-choice-form-values";
import type { QuestionnaireFieldFormErrors } from "@/common/contracts/crm/questionnaire/questionnaire-field-form-errors";
import type { QuestionnaireFieldFormValues } from "@/common/contracts/crm/questionnaire/questionnaire-field-form-values";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import {
  nextFreeQuestionnaireKey,
  suggestQuestionnaireKey,
} from "@/common/patterns/crm/questionnaire/questionnaire-key-suggestion";

const FIELD_KEY = new RegExp(QUESTIONNAIRE_KEY_PATTERN_SOURCE);
const CHOICE_KEY = new RegExp(QUESTIONNAIRE_CHOICE_KEY_PATTERN_SOURCE);

function includes(values: readonly string[], value: string): boolean {
  return values.includes(value);
}

function perLocale<T>(value: (locale: Locale) => T): Record<Locale, T> {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, value(locale)]),
  ) as Record<Locale, T>;
}

/** Yes/no and scale have fixed options whose order carries meaning, so they cannot be edited. */
export function hasFixedQuestionnaireChoices(
  type: QuestionnaireFieldType,
): boolean {
  return (
    type === QuestionnaireFieldType.YesNo ||
    type === QuestionnaireFieldType.Scale
  );
}

export function hasQuestionnaireChoices(type: QuestionnaireFieldType): boolean {
  return includes(QUESTIONNAIRE_CHOICE_FIELD_TYPE_VALUES, type);
}

export function hasQuestionnaireLengthLimit(
  type: QuestionnaireFieldType,
): boolean {
  return includes(QUESTIONNAIRE_LENGTH_LIMITED_FIELD_TYPE_VALUES, type);
}

export function hasQuestionnaireItemCount(
  type: QuestionnaireFieldType,
): boolean {
  return includes(QUESTIONNAIRE_ITEM_COUNT_FIELD_TYPE_VALUES, type);
}

/** The sources whose value fits the type; empty for types that cannot be pre-filled. */
export function questionnairePrefillSourcesFor(
  type: QuestionnaireFieldType,
): QuestionnairePrefillSource[] {
  return QUESTIONNAIRE_PREFILL_SOURCE_VALUES.filter(
    (source) => QUESTIONNAIRE_PREFILL_SOURCE_FIELD_TYPES[source] === type,
  );
}

function initialChoices(
  type: QuestionnaireFieldType,
  fixedLabels: QuestionnaireFixedChoiceLabels,
): QuestionnaireChoiceFormValues[] {
  if (type === QuestionnaireFieldType.YesNo)
    return [
      QuestionnaireYesNoChoiceKey.Yes,
      QuestionnaireYesNoChoiceKey.No,
    ].map((key) => ({
      key,
      keyEdited: true,
      labels: perLocale((locale) => fixedLabels[locale][key]),
    }));
  if (type === QuestionnaireFieldType.Scale)
    return [
      QuestionnaireScaleChoiceKey.Low,
      QuestionnaireScaleChoiceKey.High,
    ].map((key) => ({ key, keyEdited: true, labels: perLocale(() => "") }));
  return [];
}

export function createQuestionnaireFieldFormValues(
  field: QuestionnaireFieldDto | null,
  type: QuestionnaireFieldType,
  fixedLabels: QuestionnaireFixedChoiceLabels,
): QuestionnaireFieldFormValues {
  if (!field)
    return {
      type,
      key: "",
      keyEdited: false,
      requirement: QuestionnaireFieldRequirement.Optional,
      texts: perLocale(() => ({ label: "", help: "" })),
      maxLength: "",
      minItems: "",
      maxItems: "",
      acceptedAssetKinds: [],
      prefillSource: null,
      conditionFieldId: null,
      conditionChoiceId: null,
      choices: initialChoices(type, fixedLabels),
    };
  return {
    type: field.type,
    key: field.key,
    keyEdited: true,
    requirement: field.requirement,
    texts: perLocale((locale) => ({
      label: field.translations[locale]?.label ?? "",
      help: field.translations[locale]?.help ?? "",
    })),
    maxLength: field.maxLength?.toString() ?? "",
    minItems: field.minItems?.toString() ?? "",
    maxItems: field.maxItems?.toString() ?? "",
    acceptedAssetKinds: field.acceptedAssetKinds ?? [],
    prefillSource: field.prefillSource,
    conditionFieldId: field.conditionFieldId,
    conditionChoiceId: field.conditionChoiceId,
    choices: field.choices.map((choice) => ({
      key: choice.key,
      keyEdited: true,
      labels: perLocale((locale) => choice.labels[locale] ?? ""),
    })),
  };
}

/** A new type starts from its own defaults; settings of the old type would not fit. */
export function changeQuestionnaireFieldType(
  values: QuestionnaireFieldFormValues,
  type: QuestionnaireFieldType,
  fixedLabels: QuestionnaireFixedChoiceLabels,
): QuestionnaireFieldFormValues {
  return {
    ...createQuestionnaireFieldFormValues(null, type, fixedLabels),
    key: values.key,
    keyEdited: values.keyEdited,
    requirement: values.requirement,
    texts: values.texts,
    conditionFieldId: values.conditionFieldId,
    conditionChoiceId: values.conditionChoiceId,
  };
}

/** The key follows the label of the editing locale until someone edits the key itself. */
export function withQuestionnaireFieldLabel(
  values: QuestionnaireFieldFormValues,
  locale: Locale,
  label: string,
  keyLocale: Locale,
): QuestionnaireFieldFormValues {
  return {
    ...values,
    key:
      !values.keyEdited && locale === keyLocale
        ? suggestQuestionnaireKey(label)
        : values.key,
    texts: { ...values.texts, [locale]: { ...values.texts[locale], label } },
  };
}

/** A new option gets a free key from its label, or a numbered one while the label is empty. */
export function withQuestionnaireChoiceLabel(
  choices: readonly QuestionnaireChoiceFormValues[],
  index: number,
  locale: Locale,
  label: string,
  keyLocale: Locale,
): QuestionnaireChoiceFormValues[] {
  const taken = new Set(
    choices.filter((_, other) => other !== index).map((choice) => choice.key),
  );
  return choices.map((choice, position) => {
    if (position !== index) return choice;
    const key =
      !choice.keyEdited && locale === keyLocale
        ? nextFreeQuestionnaireKey(
            suggestQuestionnaireKey(label) || `option_${position + 1}`,
            taken,
          )
        : choice.key;
    return { ...choice, key, labels: { ...choice.labels, [locale]: label } };
  });
}

export function newQuestionnaireChoice(
  choices: readonly QuestionnaireChoiceFormValues[],
): QuestionnaireChoiceFormValues {
  return {
    key: nextFreeQuestionnaireKey(
      `option_${choices.length + 1}`,
      new Set(choices.map((choice) => choice.key)),
    ),
    keyEdited: false,
    labels: perLocale(() => ""),
  };
}

function isCount(value: string, minimum: number): boolean {
  if (!value.trim()) return true;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum;
}

function parseCount(value: string): number | null {
  return value.trim() ? Number(value) : null;
}

/** Only format and completeness; rules across fields stay with the server. */
export function validateQuestionnaireFieldForm(
  values: QuestionnaireFieldFormValues,
): QuestionnaireFieldFormErrors {
  const errors: QuestionnaireFieldFormErrors = {};
  if (!values.key.trim()) errors.key = QuestionnaireFormValidationCode.Required;
  else if (!FIELD_KEY.test(values.key))
    errors.key = QuestionnaireFormValidationCode.Key;
  if (!SUPPORTED_LOCALES.some((locale) => values.texts[locale].label.trim()))
    errors.label = QuestionnaireFormValidationCode.Required;
  if (hasQuestionnaireLengthLimit(values.type) && !isCount(values.maxLength, 1))
    errors.maxLength = QuestionnaireFormValidationCode.Number;
  if (hasQuestionnaireItemCount(values.type)) {
    if (!isCount(values.minItems, 0))
      errors.minItems = QuestionnaireFormValidationCode.Number;
    if (!isCount(values.maxItems, 1))
      errors.maxItems = QuestionnaireFormValidationCode.Number;
  }
  if (hasQuestionnaireChoices(values.type)) {
    if (values.choices.length < 2)
      errors.choices = QuestionnaireFormValidationCode.MinChoices;
    else if (values.choices.some((choice) => !CHOICE_KEY.test(choice.key)))
      errors.choices = QuestionnaireFormValidationCode.Key;
    else if (
      values.choices.some(
        (choice) =>
          !SUPPORTED_LOCALES.some((locale) => choice.labels[locale].trim()),
      )
    )
      errors.choices = QuestionnaireFormValidationCode.Required;
  }
  return errors;
}

/** Settings that do not fit the type are left out, so the request never carries leftovers. */
export function toQuestionnaireFieldInput(
  values: QuestionnaireFieldFormValues,
): QuestionnaireFieldInputDto {
  const translations: QuestionnaireFieldInputDto["translations"] = {};
  for (const locale of SUPPORTED_LOCALES) {
    const text = values.texts[locale];
    if (text.label.trim())
      translations[locale] = {
        label: text.label.trim(),
        help: text.help.trim() || null,
      };
  }
  const itemCount = hasQuestionnaireItemCount(values.type);
  return {
    key: values.key.trim(),
    requirement: values.requirement,
    maxLength: hasQuestionnaireLengthLimit(values.type)
      ? parseCount(values.maxLength)
      : null,
    minItems: itemCount ? parseCount(values.minItems) : null,
    maxItems: itemCount ? parseCount(values.maxItems) : null,
    acceptedAssetKinds:
      values.type === QuestionnaireFieldType.Files &&
      values.acceptedAssetKinds.length > 0
        ? values.acceptedAssetKinds
        : null,
    prefillSource:
      values.prefillSource &&
      QUESTIONNAIRE_PREFILL_SOURCE_FIELD_TYPES[values.prefillSource] ===
        values.type
        ? values.prefillSource
        : null,
    conditionFieldId: values.conditionFieldId,
    conditionChoiceId: values.conditionFieldId
      ? values.conditionChoiceId
      : null,
    translations,
    choices: hasQuestionnaireChoices(values.type)
      ? values.choices.map((choice) => ({
          key: choice.key,
          labels: Object.fromEntries(
            SUPPORTED_LOCALES.filter((locale) =>
              choice.labels[locale].trim(),
            ).map((locale) => [locale, choice.labels[locale].trim()]),
          ),
        }))
      : [],
  };
}
