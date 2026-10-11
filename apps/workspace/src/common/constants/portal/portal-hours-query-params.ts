/** Query parameters of the portal time entry list endpoint. */
export const PortalHoursQueryParam = {
  ProjectId: "projectId",
  Cursor: "cursor",
} as const;

export type PortalHoursQueryParam =
  (typeof PortalHoursQueryParam)[keyof typeof PortalHoursQueryParam];
