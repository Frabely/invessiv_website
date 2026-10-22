export const AnalyticsOptionGroup = {
  HomeServices: "home_services",
  HomeReferences: "home_references",
  LandingAudience: "landing_audience",
} as const;

export type AnalyticsOptionGroup =
  (typeof AnalyticsOptionGroup)[keyof typeof AnalyticsOptionGroup];
