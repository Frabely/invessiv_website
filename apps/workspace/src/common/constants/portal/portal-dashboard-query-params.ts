export const PortalDashboardQueryParam = {
  Widget: "widget",
  Project: "project",
} as const;

export type PortalDashboardQueryParam =
  (typeof PortalDashboardQueryParam)[keyof typeof PortalDashboardQueryParam];
