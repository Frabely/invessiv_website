export const PortalDashboardQueryParam = {
  Widget: "widget",
  Project: "project",
  /** Project filter of the time entry list inside the hours dialog. */
  HoursProject: "hoursProject",
} as const;

export type PortalDashboardQueryParam =
  (typeof PortalDashboardQueryParam)[keyof typeof PortalDashboardQueryParam];
