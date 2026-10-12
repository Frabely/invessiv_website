export const PortalDashboardQueryParam = {
  Widget: "widget",
  Project: "project",
  Chat: "chat",
  /** Project filter of the time entry list inside the hours dialog. */
  HoursProject: "hoursProject",
  /** What the service request dialog opens on: a catalog entry or `PORTAL_SERVICE_REQUEST_CUSTOM`. */
  Service: "service",
} as const;

export type PortalDashboardQueryParam =
  (typeof PortalDashboardQueryParam)[keyof typeof PortalDashboardQueryParam];

/** The only value of `?chat` that opens the dock; anything else is ignored. */
export const PORTAL_DASHBOARD_CHAT_OPEN = "open";

/** The value of `?service` that opens the free-text request instead of a catalog entry. */
export const PORTAL_SERVICE_REQUEST_CUSTOM = "custom";
