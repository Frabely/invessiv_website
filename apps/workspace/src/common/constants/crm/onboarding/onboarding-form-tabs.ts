/** Tabs of the internal form page, in the order the work on a form runs. */
export const OnboardingFormTab = {
  Structure: "structure",
  Answers: "answers",
  Review: "review",
} as const;

export type OnboardingFormTab =
  (typeof OnboardingFormTab)[keyof typeof OnboardingFormTab];

export const ONBOARDING_FORM_TAB_VALUES = [
  OnboardingFormTab.Structure,
  OnboardingFormTab.Answers,
  OnboardingFormTab.Review,
] as const;
