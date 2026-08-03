export const ProfileBridgeMessageType = {
  Ping: "ping",
  CaptureProfile: "capture_profile",
} as const;

export type ProfileBridgeMessageType =
  (typeof ProfileBridgeMessageType)[keyof typeof ProfileBridgeMessageType];
