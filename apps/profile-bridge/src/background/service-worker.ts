import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import { ProfileBridgeMessageType } from "@invessiv/common/constants/leads/outreach/profile-bridge-message-types";
import type {
  ProfileBridgeRequest,
  ProfileBridgeResponse,
} from "@invessiv/common/contracts/leads/outreach/profile-bridge-messages";
import { captureInstagramProfile } from "./instagram-client";
import { captureLinkedInProfile } from "./linkedin-client";

const VERSION = chrome.runtime.getManifest().version;

function isBridgeRequest(value: unknown): value is ProfileBridgeRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const type = (value as { type?: unknown }).type;
  return (
    type === ProfileBridgeMessageType.Ping ||
    type === ProfileBridgeMessageType.CaptureProfile
  );
}

async function handleRequest(
  request: ProfileBridgeRequest,
): Promise<ProfileBridgeResponse> {
  if (request.type === ProfileBridgeMessageType.Ping) {
    return {
      ok: true,
      type: ProfileBridgeMessageType.Ping,
      version: VERSION,
    };
  }

  if (request.platform === PitchChannel.Instagram) {
    return captureInstagramProfile(request.handle, request.profileUrl);
  }

  if (request.platform === PitchChannel.Linkedin) {
    return captureLinkedInProfile(request.profileUrl);
  }

  return { ok: false, code: ProfileBridgeErrorCode.Internal };
}

chrome.runtime.onMessageExternal.addListener(
  (message, _sender, sendResponse) => {
    if (!isBridgeRequest(message)) {
      sendResponse({ ok: false, code: ProfileBridgeErrorCode.Internal });
      return false;
    }

    handleRequest(message)
      .then(sendResponse)
      .catch(() => {
        console.warn("[profile-bridge] Message handling failed", {
          stage: "message_handler",
        });
        sendResponse({ ok: false, code: ProfileBridgeErrorCode.Internal });
      });

    return true;
  },
);
