export const AnalyticsPreferenceType = {
  Language: "language",
  Theme: "theme",
} as const;

export type AnalyticsPreferenceType =
  (typeof AnalyticsPreferenceType)[keyof typeof AnalyticsPreferenceType];
