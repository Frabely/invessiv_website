export const AnalyticsPage = {
  Home: "home",
  References: "references",
  Landing: "landing",
  LinkedIn: "linkedin",
} as const;

export type AnalyticsPage = (typeof AnalyticsPage)[keyof typeof AnalyticsPage];
