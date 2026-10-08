export const PortalDashboardQueryParam = {
  Widget: "widget",
  Project: "project",
  Chat: "chat",
} as const;

export type PortalDashboardQueryParam =
  (typeof PortalDashboardQueryParam)[keyof typeof PortalDashboardQueryParam];

/** The only value of `?chat` that opens the dock; anything else is ignored. */
export const PORTAL_DASHBOARD_CHAT_OPEN = "open";
