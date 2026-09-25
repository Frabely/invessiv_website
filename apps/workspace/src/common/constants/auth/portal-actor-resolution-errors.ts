export const PortalActorResolutionError = {
  UserMissing: "user_missing",
  UserInactive: "user_inactive",
  MembershipMissing: "membership_missing",
  AccessDenied: "access_denied",
} as const;

export type PortalActorResolutionError =
  (typeof PortalActorResolutionError)[keyof typeof PortalActorResolutionError];

export const PORTAL_ACTOR_RESOLUTION_ERROR_VALUES = [
  PortalActorResolutionError.UserMissing,
  PortalActorResolutionError.UserInactive,
  PortalActorResolutionError.MembershipMissing,
  PortalActorResolutionError.AccessDenied,
] as const;
