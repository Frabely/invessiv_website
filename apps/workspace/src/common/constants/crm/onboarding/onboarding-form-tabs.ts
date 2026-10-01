/** Tabs of the internal form page; answers and review follow with their tasks. */
export const OnboardingFormTab = {
  Structure: "structure",
} as const;

export type OnboardingFormTab =
  (typeof OnboardingFormTab)[keyof typeof OnboardingFormTab];

export const ONBOARDING_FORM_TAB_VALUES = [
  OnboardingFormTab.Structure,
] as const;
