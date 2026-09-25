/**
 * No separate "inactive" status, unlike the workspace: an inactive user, a revoked membership and
 * a missing `portal.access` permission all collapse into `NotMember`. The portal never confirms
 * that a membership once existed.
 */
export const PortalAuthStatus = {
  Authorized: "authorized",
  Unauthenticated: "unauthenticated",
  NotMember: "not_member",
  Unavailable: "unavailable",
} as const;

export type PortalAuthStatus =
  (typeof PortalAuthStatus)[keyof typeof PortalAuthStatus];

export const PORTAL_AUTH_STATUS_VALUES = [
  PortalAuthStatus.Authorized,
  PortalAuthStatus.Unauthenticated,
  PortalAuthStatus.NotMember,
  PortalAuthStatus.Unavailable,
] as const;
