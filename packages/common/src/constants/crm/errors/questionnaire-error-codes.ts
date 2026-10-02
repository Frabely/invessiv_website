export const QuestionnaireErrorCode = {
  TemplateNotFound: "QUESTIONNAIRE_TEMPLATE_NOT_FOUND",
  BlockNotFound: "QUESTIONNAIRE_BLOCK_NOT_FOUND",
  FieldNotFound: "QUESTIONNAIRE_FIELD_NOT_FOUND",
  TranslationRequired: "QUESTIONNAIRE_TRANSLATION_REQUIRED",
  InvalidCondition: "QUESTIONNAIRE_INVALID_CONDITION",
  InvalidFieldConfig: "QUESTIONNAIRE_INVALID_FIELD_CONFIG",
  BlockInUse: "QUESTIONNAIRE_BLOCK_IN_USE",
  ChoiceInUse: "QUESTIONNAIRE_CHOICE_IN_USE",
  LastField: "QUESTIONNAIRE_LAST_FIELD",
  LimitReached: "QUESTIONNAIRE_LIMIT_REACHED",
  KeyTaken: "QUESTIONNAIRE_KEY_TAKEN",
  NotEditable: "QUESTIONNAIRE_NOT_EDITABLE",
  ValidationError: "VALIDATION_ERROR",
  Internal: "INTERNAL",
} as const;

export type QuestionnaireErrorCode =
  (typeof QuestionnaireErrorCode)[keyof typeof QuestionnaireErrorCode];

export const QUESTIONNAIRE_ERROR_CODE_VALUES = Object.values(
  QuestionnaireErrorCode,
) as readonly QuestionnaireErrorCode[];
