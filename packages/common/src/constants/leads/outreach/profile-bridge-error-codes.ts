export const ProfileBridgeErrorCode = {
  NotConfigured: "BRIDGE_NOT_CONFIGURED",
  BridgeMissing: "BRIDGE_MISSING",
  NotLoggedIn: "NOT_LOGGED_IN",
  ProfileNotFound: "PROFILE_NOT_FOUND",
  ProfilePrivate: "PROFILE_PRIVATE",
  TabNotOpen: "TAB_NOT_OPEN",
  RateLimited: "RATE_LIMITED",
  Timeout: "TIMEOUT",
  NetworkError: "BRIDGE_NETWORK_ERROR",
  UpstreamUnavailable: "BRIDGE_UPSTREAM_UNAVAILABLE",
  InvalidResponse: "BRIDGE_INVALID_RESPONSE",
  Internal: "BRIDGE_INTERNAL",
} as const;

export type ProfileBridgeErrorCode =
  (typeof ProfileBridgeErrorCode)[keyof typeof ProfileBridgeErrorCode];
