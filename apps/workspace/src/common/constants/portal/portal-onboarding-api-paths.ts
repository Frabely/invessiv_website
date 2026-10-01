/** Path segments of the portal onboarding routes below `/api/portal/[customerId]`. */
export const PortalOnboardingApiPath = {
  Onboarding: "onboarding",
  Answers: "answers",
  Submit: "submit",
} as const;

export type PortalOnboardingApiPath =
  (typeof PortalOnboardingApiPath)[keyof typeof PortalOnboardingApiPath];
