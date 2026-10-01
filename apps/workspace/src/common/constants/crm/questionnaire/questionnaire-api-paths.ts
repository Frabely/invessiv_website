/** Path segments below the questionnaire catalog endpoints. */
export const QuestionnaireApiPath = {
  Duplicate: "duplicate",
  Fields: "fields",
  Move: "move",
} as const;

export type QuestionnaireApiPath =
  (typeof QuestionnaireApiPath)[keyof typeof QuestionnaireApiPath];
