export const OnboardingFieldRequirement = {
  Required: "required",
  Optional: "optional",
} as const;

export type OnboardingFieldRequirement =
  (typeof OnboardingFieldRequirement)[keyof typeof OnboardingFieldRequirement];

export const ONBOARDING_FIELD_REQUIREMENT_VALUES = [
  OnboardingFieldRequirement.Required,
  OnboardingFieldRequirement.Optional,
] as const;
