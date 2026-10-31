/** Path segments of the internal onboarding form routes. */
export const OnboardingApiPath = {
  Onboarding: "onboarding",
  Blocks: "blocks",
  Template: "template",
  Fields: "fields",
  Move: "move",
  Usage: "usage",
  Release: "release",
  Review: "review",
  RequestChanges: "request-changes",
  Complete: "complete",
  Export: "export",
} as const;

export type OnboardingApiPath =
  (typeof OnboardingApiPath)[keyof typeof OnboardingApiPath];
