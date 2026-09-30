/** A `yes_no` field has exactly these two options; conditions address them by key. */
export const OnboardingYesNoChoiceKey = {
  Yes: "yes",
  No: "no",
} as const;

export type OnboardingYesNoChoiceKey =
  (typeof OnboardingYesNoChoiceKey)[keyof typeof OnboardingYesNoChoiceKey];

export const ONBOARDING_YES_NO_CHOICE_KEY_VALUES = [
  OnboardingYesNoChoiceKey.Yes,
  OnboardingYesNoChoiceKey.No,
] as const;
