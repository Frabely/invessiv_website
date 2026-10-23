export const AnalyticsOptionGroup = {
  HomeServices: "home_services",
  LandingAudience: "landing_audience",
} as const;

export type AnalyticsOptionGroup =
  (typeof AnalyticsOptionGroup)[keyof typeof AnalyticsOptionGroup];
