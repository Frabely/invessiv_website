/** Archived catalog entries stay readable but drop out of pickers; blocks of a form are never archived. */
export const OnboardingCatalogStatus = {
  Active: "active",
  Archived: "archived",
} as const;

export type OnboardingCatalogStatus =
  (typeof OnboardingCatalogStatus)[keyof typeof OnboardingCatalogStatus];

export const ONBOARDING_CATALOG_STATUS_VALUES = [
  OnboardingCatalogStatus.Active,
  OnboardingCatalogStatus.Archived,
] as const;
