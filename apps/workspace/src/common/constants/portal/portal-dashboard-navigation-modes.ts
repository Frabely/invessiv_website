export const PortalDashboardNavigationMode = {
  Push: "push",
  Replace: "replace",
} as const;

export type PortalDashboardNavigationMode =
  (typeof PortalDashboardNavigationMode)[keyof typeof PortalDashboardNavigationMode];
