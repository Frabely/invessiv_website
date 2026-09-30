export const OnboardingTransitionSide = {
  Internal: "internal",
  Customer: "customer",
} as const;

export type OnboardingTransitionSide =
  (typeof OnboardingTransitionSide)[keyof typeof OnboardingTransitionSide];

export const ONBOARDING_TRANSITION_SIDE_VALUES = [
  OnboardingTransitionSide.Internal,
  OnboardingTransitionSide.Customer,
] as const;
