/** What a release may still go ahead with once the team has acknowledged it. */
export const OnboardingReleaseWarningKind = {
  MissingTranslation: "missing_translation",
  NoPortalAccess: "no_portal_access",
} as const;

export type OnboardingReleaseWarningKind =
  (typeof OnboardingReleaseWarningKind)[keyof typeof OnboardingReleaseWarningKind];

export const ONBOARDING_RELEASE_WARNING_KIND_VALUES = [
  OnboardingReleaseWarningKind.MissingTranslation,
  OnboardingReleaseWarningKind.NoPortalAccess,
] as const;
