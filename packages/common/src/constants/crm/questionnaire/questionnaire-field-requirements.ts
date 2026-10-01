export const QuestionnaireFieldRequirement = {
  Required: "required",
  Optional: "optional",
} as const;

export type QuestionnaireFieldRequirement =
  (typeof QuestionnaireFieldRequirement)[keyof typeof QuestionnaireFieldRequirement];

export const QUESTIONNAIRE_FIELD_REQUIREMENT_VALUES = [
  QuestionnaireFieldRequirement.Required,
  QuestionnaireFieldRequirement.Optional,
] as const;
