/** URL parameters of the portal onboarding pages and their API. */
export const PortalOnboardingQueryParam = {
  /** Block id of the step shown; the review step uses `PORTAL_ONBOARDING_REVIEW_SECTION`. */
  Section: "section",
  /** Field to focus after a jump from the list of missing answers. */
  Field: "field",
  /** Locale the API resolves block and field texts in. */
  Locale: "locale",
} as const;

export type PortalOnboardingQueryParam =
  (typeof PortalOnboardingQueryParam)[keyof typeof PortalOnboardingQueryParam];

/** `section` value of the last step, where the customer reviews and submits. */
export const PORTAL_ONBOARDING_REVIEW_SECTION = "review";
