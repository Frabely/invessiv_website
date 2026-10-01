/** Path segments of the internal onboarding form routes. */
export const OnboardingApiPath = {
  Onboarding: "onboarding",
  Blocks: "blocks",
  Fields: "fields",
  Move: "move",
  Usage: "usage",
  Release: "release",
} as const;

export type OnboardingApiPath =
  (typeof OnboardingApiPath)[keyof typeof OnboardingApiPath];
