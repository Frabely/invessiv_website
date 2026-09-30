/**
 * The two options of a `scale` field only label its poles. The answer is a step in `value`
 * (`"1"` up to `ONBOARDING_LIMITS.scaleSteps`), never a `choice_id`.
 */
export const OnboardingScaleChoiceKey = {
  Low: "low",
  High: "high",
} as const;

export type OnboardingScaleChoiceKey =
  (typeof OnboardingScaleChoiceKey)[keyof typeof OnboardingScaleChoiceKey];

export const ONBOARDING_SCALE_CHOICE_KEY_VALUES = [
  OnboardingScaleChoiceKey.Low,
  OnboardingScaleChoiceKey.High,
] as const;
