export const PortalServiceRequestErrorCode = {
  /** Also a missing right, a foreign company or a service that is no longer offered: the portal never tells these apart. */
  NotFound: "not_found",
  Validation: "validation",
  /** The company already has `PortalServiceRequestLimits.OpenPerCustomer` open requests. */
  LimitReached: "limit_reached",
  /** A further feedback round is already requested for this project. */
  DuplicateOpen: "duplicate_open",
  /** The team already works on the request; it can no longer be withdrawn. */
  Locked: "locked",
  Internal: "internal",
} as const;

export type PortalServiceRequestErrorCode =
  (typeof PortalServiceRequestErrorCode)[keyof typeof PortalServiceRequestErrorCode];

export const PORTAL_SERVICE_REQUEST_ERROR_CODE_VALUES = [
  PortalServiceRequestErrorCode.NotFound,
  PortalServiceRequestErrorCode.Validation,
  PortalServiceRequestErrorCode.LimitReached,
  PortalServiceRequestErrorCode.DuplicateOpen,
  PortalServiceRequestErrorCode.Locked,
  PortalServiceRequestErrorCode.Internal,
] as const;
