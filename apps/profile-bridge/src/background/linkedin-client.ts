import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import { ProfileBridgeMessageType } from "@invessiv/common/constants/leads/outreach/profile-bridge-message-types";
import type { ProfileBridgeResponse } from "@invessiv/common/contracts/leads/outreach/profile-bridge-messages";
import { readLinkedInProfileFromDom } from "../content/linkedin-reader";
import {
  extractLinkedInSlug,
  normalizeLinkedInProfile,
} from "../normalize/normalize-linkedin-profile";
import { throttle } from "./rate-limiter";

const PROFILE_TAB_PATTERN = "https://www.linkedin.com/in/*";

async function findProfileTab(slug: string): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({ url: PROFILE_TAB_PATTERN });
  const match = tabs.find((tab) =>
    (tab.url ?? "").toLowerCase().includes(`/in/${slug.toLowerCase()}`),
  );

  return match ?? null;
}

export async function captureLinkedInProfile(
  profileUrl: string | null,
): Promise<ProfileBridgeResponse> {
  const slug = extractLinkedInSlug(profileUrl);
  if (!slug) {
    return { ok: false, code: ProfileBridgeErrorCode.ProfileNotFound };
  }

  const tab = await findProfileTab(slug);
  if (!tab?.id) {
    return { ok: false, code: ProfileBridgeErrorCode.TabNotOpen };
  }

  await throttle(PitchChannel.Linkedin);

  let injection;
  try {
    [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: readLinkedInProfileFromDom,
    });
  } catch {
    console.warn("[profile-bridge] LinkedIn DOM injection failed", {
      stage: "dom_injection",
    });
    return { ok: false, code: ProfileBridgeErrorCode.Internal };
  }

  if (!injection?.result) {
    return { ok: false, code: ProfileBridgeErrorCode.ProfileNotFound };
  }

  const snapshot = normalizeLinkedInProfile(injection.result, slug);
  if (!snapshot) {
    return { ok: false, code: ProfileBridgeErrorCode.ProfileNotFound };
  }

  return {
    ok: true,
    type: ProfileBridgeMessageType.CaptureProfile,
    snapshot,
  };
}
