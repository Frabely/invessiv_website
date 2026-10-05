/** What the step track says about one block of the onboarding form. */
export const OnboardingStepStatusKind = {
  /** Nothing answered yet. */
  Untouched: "untouched",
  /** Started, with questions still open. */
  Incomplete: "incomplete",
  /** Every visible question answered. */
  Complete: "complete",
  /** Invalid input, or a started/visited block left with a required answer missing. */
  Attention: "attention",
} as const;

export type OnboardingStepStatusKind =
  (typeof OnboardingStepStatusKind)[keyof typeof OnboardingStepStatusKind];

export const ONBOARDING_STEP_STATUS_KIND_VALUES = [
  OnboardingStepStatusKind.Untouched,
  OnboardingStepStatusKind.Incomplete,
  OnboardingStepStatusKind.Complete,
  OnboardingStepStatusKind.Attention,
] as const;
