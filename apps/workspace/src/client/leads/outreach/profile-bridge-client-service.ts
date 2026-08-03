"use client";

import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import { ProfileBridgeMessageType } from "@invessiv/common/constants/leads/outreach/profile-bridge-message-types";
import type {
  ProfileBridgeRequest,
  ProfileBridgeResponse,
} from "@invessiv/common/contracts/leads/outreach/profile-bridge-messages";
import {
  PITCH_BRIDGE_PING_TIMEOUT_MS,
  PITCH_BRIDGE_TIMEOUT_MS,
} from "@invessiv/common/defaults/leads/outreach/lead-pitch-defaults";

type ChromeRuntime = {
  sendMessage: (
    extensionId: string,
    message: ProfileBridgeRequest,
    callback: (response: unknown) => void,
  ) => void;
  lastError?: { message?: string };
};

function getExtensionId(): string | null {
  const id = process.env.NEXT_PUBLIC_PROFILE_BRIDGE_EXTENSION_ID;
  return id && id.length > 0 ? id : null;
}

function getRuntime(): ChromeRuntime | null {
  const runtime = (
    globalThis as unknown as { chrome?: { runtime?: ChromeRuntime } }
  ).chrome?.runtime;

  return runtime && typeof runtime.sendMessage === "function" ? runtime : null;
}

function isBridgeResponse(value: unknown): value is ProfileBridgeResponse {
  if (typeof value !== "object" || value === null || !("ok" in value)) {
    return false;
  }

  if (value.ok === true) {
    return "type" in value;
  }

  if (value.ok !== false || !("code" in value)) {
    return false;
  }

  return Object.values(ProfileBridgeErrorCode).some(
    (code) => code === value.code,
  );
}

function send(
  request: ProfileBridgeRequest,
  timeoutMs: number,
): Promise<ProfileBridgeResponse> {
  const extensionId = getExtensionId();

  if (!extensionId) {
    return Promise.resolve({
      ok: false,
      code: ProfileBridgeErrorCode.NotConfigured,
    });
  }

  const runtime = getRuntime();

  if (!runtime) {
    return Promise.resolve({
      ok: false,
      code: ProfileBridgeErrorCode.BridgeMissing,
    });
  }

  return new Promise((resolve) => {
    let settled = false;

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, code: ProfileBridgeErrorCode.Timeout });
    }, timeoutMs);

    runtime.sendMessage(extensionId, request, (response) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);

      if (runtime.lastError || !response) {
        resolve({ ok: false, code: ProfileBridgeErrorCode.BridgeMissing });
        return;
      }

      resolve(
        isBridgeResponse(response)
          ? response
          : { ok: false, code: ProfileBridgeErrorCode.Internal },
      );
    });
  });
}

async function isAvailable(): Promise<boolean> {
  const response = await send(
    { type: ProfileBridgeMessageType.Ping },
    PITCH_BRIDGE_PING_TIMEOUT_MS,
  );

  return response.ok;
}

async function captureProfile(params: {
  platform: PitchChannel;
  handle: string | null;
  profileUrl: string | null;
}): Promise<ProfileBridgeResponse> {
  return send(
    {
      type: ProfileBridgeMessageType.CaptureProfile,
      platform: params.platform,
      handle: params.handle,
      profileUrl: params.profileUrl,
    },
    PITCH_BRIDGE_TIMEOUT_MS,
  );
}

export const profileBridgeClientService = {
  captureProfile,
  isAvailable,
} as const;
