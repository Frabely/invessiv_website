/**
 * The fixed set of field types. Rendering and validation of a type are code; texts, options,
 * requirement, limits and conditions of a field are data.
 */
export const QuestionnaireFieldType = {
  ShortText: "short_text",
  LongText: "long_text",
  Email: "email",
  Phone: "phone",
  Url: "url",
  Choice: "choice",
  MultiChoice: "multi_choice",
  YesNo: "yes_no",
  Scale: "scale",
  Color: "color",
  Files: "files",
  Confirmation: "confirmation",
  Group: "group",
  ProjectServices: "project_services",
} as const;

export type QuestionnaireFieldType =
  (typeof QuestionnaireFieldType)[keyof typeof QuestionnaireFieldType];

export const QUESTIONNAIRE_FIELD_TYPE_VALUES = [
  QuestionnaireFieldType.ShortText,
  QuestionnaireFieldType.LongText,
  QuestionnaireFieldType.Email,
  QuestionnaireFieldType.Phone,
  QuestionnaireFieldType.Url,
  QuestionnaireFieldType.Choice,
  QuestionnaireFieldType.MultiChoice,
  QuestionnaireFieldType.YesNo,
  QuestionnaireFieldType.Scale,
  QuestionnaireFieldType.Color,
  QuestionnaireFieldType.Files,
  QuestionnaireFieldType.Confirmation,
  QuestionnaireFieldType.Group,
  QuestionnaireFieldType.ProjectServices,
] as const;

/** Types that carry rows in `questionnaire_field_choices`. For `scale` they only label the two poles. */
export const QUESTIONNAIRE_CHOICE_FIELD_TYPE_VALUES = [
  QuestionnaireFieldType.Choice,
  QuestionnaireFieldType.MultiChoice,
  QuestionnaireFieldType.YesNo,
  QuestionnaireFieldType.Scale,
] as const;

/** Types whose answer references a `choice_id` instead of a `value`. */
export const QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES = [
  QuestionnaireFieldType.Choice,
  QuestionnaireFieldType.MultiChoice,
  QuestionnaireFieldType.YesNo,
] as const;

/** Only these may make another field of the same block and level visible. */
export const QUESTIONNAIRE_CONDITION_TRIGGER_TYPE_VALUES = [
  QuestionnaireFieldType.Choice,
  QuestionnaireFieldType.MultiChoice,
  QuestionnaireFieldType.YesNo,
] as const;

/** Free text stored in `value`; a non-empty value answers the field. */
export const QUESTIONNAIRE_TEXT_FIELD_TYPE_VALUES = [
  QuestionnaireFieldType.ShortText,
  QuestionnaireFieldType.LongText,
  QuestionnaireFieldType.Email,
  QuestionnaireFieldType.Phone,
  QuestionnaireFieldType.Url,
] as const;

/** Only these may set `max_length`. */
export const QUESTIONNAIRE_LENGTH_LIMITED_FIELD_TYPE_VALUES = [
  QuestionnaireFieldType.ShortText,
  QuestionnaireFieldType.LongText,
] as const;

/** Only these may set `min_items`/`max_items`; each counts entries instead of a single value. */
export const QUESTIONNAIRE_ITEM_COUNT_FIELD_TYPE_VALUES = [
  QuestionnaireFieldType.Files,
  QuestionnaireFieldType.Group,
  QuestionnaireFieldType.MultiChoice,
] as const;

/** Groups are exactly one level deep, and the service confirmation belongs to the form itself. */
export const QUESTIONNAIRE_GROUP_CHILD_EXCLUDED_TYPE_VALUES = [
  QuestionnaireFieldType.Group,
  QuestionnaireFieldType.ProjectServices,
] as const;

/**
 * Types without rows in `onboarding_answers`: files live in `onboarding_answer_files`, group
 * entries in `onboarding_group_entries`, the service confirmation on `onboarding_forms`.
 */
export const QUESTIONNAIRE_NON_ANSWER_ROW_TYPE_VALUES = [
  QuestionnaireFieldType.Files,
  QuestionnaireFieldType.Group,
  QuestionnaireFieldType.ProjectServices,
] as const;
