import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import type { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import type { ProfileBridgeMessageType } from "@invessiv/common/constants/leads/outreach/profile-bridge-message-types";
import type { ProfileSnapshot } from "./profile-snapshot";

export interface ProfileBridgePingRequest {
  type: typeof ProfileBridgeMessageType.Ping;
}

export interface ProfileBridgeCaptureRequest {
  type: typeof ProfileBridgeMessageType.CaptureProfile;
  platform: PitchChannel;
  handle: string | null;
  profileUrl: string | null;
}

export type ProfileBridgeRequest =
  ProfileBridgePingRequest | ProfileBridgeCaptureRequest;

export interface ProfileBridgePongResponse {
  ok: true;
  type: typeof ProfileBridgeMessageType.Ping;
  version: string;
}

export interface ProfileBridgeCaptureSuccess {
  ok: true;
  type: typeof ProfileBridgeMessageType.CaptureProfile;
  snapshot: ProfileSnapshot;
}

export interface ProfileBridgeFailure {
  ok: false;
  code: ProfileBridgeErrorCode;
}

export type ProfileBridgeResponse =
  | ProfileBridgePongResponse
  | ProfileBridgeCaptureSuccess
  | ProfileBridgeFailure;
