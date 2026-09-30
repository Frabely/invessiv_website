/** `call` puts the question on the call agenda; `customer` reopens the block in the portal. */
export const OnboardingClarificationMode = {
  Call: "call",
  Customer: "customer",
} as const;

export type OnboardingClarificationMode =
  (typeof OnboardingClarificationMode)[keyof typeof OnboardingClarificationMode];

export const ONBOARDING_CLARIFICATION_MODE_VALUES = [
  OnboardingClarificationMode.Call,
  OnboardingClarificationMode.Customer,
] as const;
