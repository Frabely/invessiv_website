export const PortalHoursErrorCode = {
  /** Also a missing right or a foreign company: the portal never tells these apart. */
  NotFound: "not_found",
  Validation: "validation",
  Internal: "internal",
} as const;

export type PortalHoursErrorCode =
  (typeof PortalHoursErrorCode)[keyof typeof PortalHoursErrorCode];

export const PORTAL_HOURS_ERROR_CODE_VALUES = [
  PortalHoursErrorCode.NotFound,
  PortalHoursErrorCode.Validation,
  PortalHoursErrorCode.Internal,
] as const;
