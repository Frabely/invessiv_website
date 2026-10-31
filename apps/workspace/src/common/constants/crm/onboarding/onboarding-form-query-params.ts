/** Query params of the internal form page; the block editor adds its own, prefixed ones. */
export const OnboardingFormQueryParam = {
  Tab: "tab",
  Block: "block",
  ReviewFilter: "reviewFilter",
  /** Locale the export endpoint resolves block and field texts in. */
  Locale: "locale",
} as const;

export type OnboardingFormQueryParam =
  (typeof OnboardingFormQueryParam)[keyof typeof OnboardingFormQueryParam];
