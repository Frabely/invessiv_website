/** A `yes_no` field has exactly these two options; conditions address them by key. */
export const QuestionnaireYesNoChoiceKey = {
  Yes: "yes",
  No: "no",
} as const;

export type QuestionnaireYesNoChoiceKey =
  (typeof QuestionnaireYesNoChoiceKey)[keyof typeof QuestionnaireYesNoChoiceKey];

export const QUESTIONNAIRE_YES_NO_CHOICE_KEY_VALUES = [
  QuestionnaireYesNoChoiceKey.Yes,
  QuestionnaireYesNoChoiceKey.No,
] as const;
