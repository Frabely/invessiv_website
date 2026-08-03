import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import type { ProfileBridgeResponse } from "@invessiv/common/contracts/leads/outreach/profile-bridge-messages";
import { ProfileBridgeMessageType } from "@invessiv/common/constants/leads/outreach/profile-bridge-message-types";
import { normalizeInstagramProfile } from "../normalize/normalize-instagram-profile";
import { throttle } from "./rate-limiter";

const PROFILE_ENDPOINT =
  "https://www.instagram.com/api/v1/users/web_profile_info/";
const IG_APP_ID = "936619743392459";
const MIN_BIO_LENGTH = 20;

export function extractInstagramHandle(
  handle: string | null,
  profileUrl: string | null,
): string | null {
  if (handle && handle.trim().length > 0) {
    return handle.trim().replace(/^@/, "");
  }

  if (!profileUrl) {
    return null;
  }

  try {
    const url = new URL(profileUrl);
    const [segment] = url.pathname.split("/").filter(Boolean);
    return segment ?? null;
  } catch {
    return null;
  }
}

export async function captureInstagramProfile(
  handle: string | null,
  profileUrl: string | null,
): Promise<ProfileBridgeResponse> {
  const username = extractInstagramHandle(handle, profileUrl);
  if (!username) {
    return { ok: false, code: ProfileBridgeErrorCode.ProfileNotFound };
  }

  await throttle(PitchChannel.Instagram);

  let response: Response;
  try {
    response = await fetch(
      `${PROFILE_ENDPOINT}?username=${encodeURIComponent(username)}`,
      {
        credentials: "include",
        headers: {
          "X-IG-App-ID": IG_APP_ID,
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );
  } catch {
    console.warn("[profile-bridge] Instagram request failed", {
      stage: "fetch",
    });
    return { ok: false, code: ProfileBridgeErrorCode.NetworkError };
  }

  if (response.status === 404) {
    return { ok: false, code: ProfileBridgeErrorCode.ProfileNotFound };
  }

  if (response.status === 401 || response.status === 403) {
    return { ok: false, code: ProfileBridgeErrorCode.NotLoggedIn };
  }

  if (response.status === 429) {
    return { ok: false, code: ProfileBridgeErrorCode.RateLimited };
  }

  if (response.status >= 500) {
    console.warn("[profile-bridge] Instagram is unavailable", {
      stage: "response",
      status: response.status,
    });
    return {
      ok: false,
      code: ProfileBridgeErrorCode.UpstreamUnavailable,
    };
  }

  if (!response.ok) {
    console.warn("[profile-bridge] Instagram returned an unexpected status", {
      stage: "response",
      status: response.status,
    });
    return { ok: false, code: ProfileBridgeErrorCode.InvalidResponse };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    console.warn("[profile-bridge] Instagram returned invalid JSON", {
      stage: "parse",
      status: response.status,
    });
    return { ok: false, code: ProfileBridgeErrorCode.InvalidResponse };
  }

  const normalized = normalizeInstagramProfile(payload);
  if (!normalized) {
    return { ok: false, code: ProfileBridgeErrorCode.ProfileNotFound };
  }

  const hasReadableBio =
    (normalized.snapshot.biography ?? "").length >= MIN_BIO_LENGTH;

  if (
    normalized.isPrivate &&
    normalized.snapshot.posts.length === 0 &&
    !hasReadableBio
  ) {
    return { ok: false, code: ProfileBridgeErrorCode.ProfilePrivate };
  }

  return {
    ok: true,
    type: ProfileBridgeMessageType.CaptureProfile,
    snapshot: normalized.snapshot,
  };
}
