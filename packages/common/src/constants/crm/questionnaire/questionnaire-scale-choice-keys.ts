/**
 * The two options of a `scale` field only label its poles. The answer is a step in `value`
 * (`"1"` up to `QUESTIONNAIRE_LIMITS.scaleSteps`), never a `choice_id`.
 */
export const QuestionnaireScaleChoiceKey = {
  Low: "low",
  High: "high",
} as const;

export type QuestionnaireScaleChoiceKey =
  (typeof QuestionnaireScaleChoiceKey)[keyof typeof QuestionnaireScaleChoiceKey];

export const QUESTIONNAIRE_SCALE_CHOICE_KEY_VALUES = [
  QuestionnaireScaleChoiceKey.Low,
  QuestionnaireScaleChoiceKey.High,
] as const;
