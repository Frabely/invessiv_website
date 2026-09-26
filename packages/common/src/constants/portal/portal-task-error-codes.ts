export const PortalTaskErrorCode = {
  NotFound: "not_found",
  Unavailable: "unavailable",
} as const;

export type PortalTaskErrorCode =
  (typeof PortalTaskErrorCode)[keyof typeof PortalTaskErrorCode];
