/** Query params of the internal form page; the block editor adds its own, prefixed ones. */
export const OnboardingFormQueryParam = {
  Tab: "tab",
  Block: "block",
} as const;

export type OnboardingFormQueryParam =
  (typeof OnboardingFormQueryParam)[keyof typeof OnboardingFormQueryParam];
