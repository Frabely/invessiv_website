/** Tabs of the internal form page; the review follows with its task. */
export const OnboardingFormTab = {
  Structure: "structure",
  Answers: "answers",
} as const;

export type OnboardingFormTab =
  (typeof OnboardingFormTab)[keyof typeof OnboardingFormTab];

export const ONBOARDING_FORM_TAB_VALUES = [
  OnboardingFormTab.Structure,
  OnboardingFormTab.Answers,
] as const;
