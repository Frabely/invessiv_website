/** Window events of the portal onboarding form. */
export const PortalOnboardingEvent = {
  /** `pushState` emits no `popstate`; the step hook announces its own URL writes with this. */
  StepChanged: "portal:onboarding-step-changed",
} as const;

export type PortalOnboardingEvent =
  (typeof PortalOnboardingEvent)[keyof typeof PortalOnboardingEvent];
