/** Client checks of the catalog dialogs; each code is a text in `catalog.validation`. */
export const QuestionnaireFormValidationCode = {
  Required: "required",
  Key: "key",
  Number: "number",
  MinChoices: "minChoices",
} as const;

export type QuestionnaireFormValidationCode =
  (typeof QuestionnaireFormValidationCode)[keyof typeof QuestionnaireFormValidationCode];

export const QUESTIONNAIRE_FORM_VALIDATION_CODE_VALUES = [
  QuestionnaireFormValidationCode.Required,
  QuestionnaireFormValidationCode.Key,
  QuestionnaireFormValidationCode.Number,
  QuestionnaireFormValidationCode.MinChoices,
] as const;
