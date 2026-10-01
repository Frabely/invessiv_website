/** Why `validateQuestionnaireValue` rejected a raw value; the UI maps each code to a dictionary text. */
export const QuestionnaireValueErrorCode = {
  Empty: "empty",
  TooLong: "too_long",
  InvalidEmail: "invalid_email",
  InvalidPhone: "invalid_phone",
  InvalidUrl: "invalid_url",
  InvalidColor: "invalid_color",
  InvalidScale: "invalid_scale",
  NotConfirmed: "not_confirmed",
  NotAValueField: "not_a_value_field",
} as const;

export type QuestionnaireValueErrorCode =
  (typeof QuestionnaireValueErrorCode)[keyof typeof QuestionnaireValueErrorCode];

export const QUESTIONNAIRE_VALUE_ERROR_CODE_VALUES = [
  QuestionnaireValueErrorCode.Empty,
  QuestionnaireValueErrorCode.TooLong,
  QuestionnaireValueErrorCode.InvalidEmail,
  QuestionnaireValueErrorCode.InvalidPhone,
  QuestionnaireValueErrorCode.InvalidUrl,
  QuestionnaireValueErrorCode.InvalidColor,
  QuestionnaireValueErrorCode.InvalidScale,
  QuestionnaireValueErrorCode.NotConfirmed,
  QuestionnaireValueErrorCode.NotAValueField,
] as const;
