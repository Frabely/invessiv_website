export const DashboardQueryParam = {
  DateFrom: "date_from",
  DateTo: "date_to",
  Range: "range",
} as const;

export type DashboardQueryParam =
  (typeof DashboardQueryParam)[keyof typeof DashboardQueryParam];
