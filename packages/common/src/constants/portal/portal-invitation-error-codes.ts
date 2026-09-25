export const PortalInvitationErrorCode = {
  Invalid: "invalid",
  Expired: "expired",
  Redeemed: "redeemed",
  Unauthenticated: "unauthenticated",
  Unavailable: "unavailable",
} as const;

export type PortalInvitationErrorCode =
  (typeof PortalInvitationErrorCode)[keyof typeof PortalInvitationErrorCode];
