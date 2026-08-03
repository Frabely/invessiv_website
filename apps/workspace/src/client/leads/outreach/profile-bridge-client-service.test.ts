// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import { ProfileBridgeMessageType } from "@invessiv/common/constants/leads/outreach/profile-bridge-message-types";
import { PITCH_BRIDGE_TIMEOUT_MS } from "@invessiv/common/defaults/leads/outreach/lead-pitch-defaults";
import { profileBridgeClientService } from "./profile-bridge-client-service";

const EXTENSION_ID = "abcdefghijklmnopabcdefghijklmnop";

const CAPTURE_INPUT = {
  platform: PitchChannel.Instagram,
  handle: "kanzlei",
  profileUrl: "https://www.instagram.com/kanzlei/",
};

type SendMessage = (
  extensionId: string,
  message: unknown,
  callback: (response: unknown) => void,
) => void;

function installRuntime(
  sendMessage: SendMessage,
  lastError?: { message: string },
) {
  Object.defineProperty(globalThis, "chrome", {
    configurable: true,
    value: { runtime: { sendMessage, lastError } },
    writable: true,
  });
}

function removeRuntime() {
  Object.defineProperty(globalThis, "chrome", {
    configurable: true,
    value: undefined,
    writable: true,
  });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_PROFILE_BRIDGE_EXTENSION_ID", EXTENSION_ID);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  removeRuntime();
});

describe("profileBridgeClientService.captureProfile", () => {
  it("reports BRIDGE_NOT_CONFIGURED when no extension id is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_PROFILE_BRIDGE_EXTENSION_ID", "");
    installRuntime(vi.fn());

    const result =
      await profileBridgeClientService.captureProfile(CAPTURE_INPUT);

    expect(result).toEqual({
      ok: false,
      code: ProfileBridgeErrorCode.NotConfigured,
    });
  });

  it("reports BRIDGE_MISSING when the page cannot reach any extension", async () => {
    removeRuntime();

    const result =
      await profileBridgeClientService.captureProfile(CAPTURE_INPUT);

    expect(result).toEqual({
      ok: false,
      code: ProfileBridgeErrorCode.BridgeMissing,
    });
  });

  it("passes a successful snapshot through unchanged", async () => {
    const snapshot = { platform: PitchChannel.Instagram };
    installRuntime((_id, _message, callback) =>
      callback({
        ok: true,
        type: ProfileBridgeMessageType.CaptureProfile,
        snapshot,
      }),
    );

    const result =
      await profileBridgeClientService.captureProfile(CAPTURE_INPUT);

    expect(result).toMatchObject({ ok: true, snapshot });
  });

  it("reports BRIDGE_MISSING when chrome sets lastError", async () => {
    installRuntime((_id, _message, callback) => callback(undefined), {
      message: "Could not establish connection.",
    });

    const result =
      await profileBridgeClientService.captureProfile(CAPTURE_INPUT);

    expect(result).toEqual({
      ok: false,
      code: ProfileBridgeErrorCode.BridgeMissing,
    });
  });

  it("reports TIMEOUT when the extension never answers", async () => {
    vi.useFakeTimers();
    installRuntime(() => undefined);

    const pending = profileBridgeClientService.captureProfile(CAPTURE_INPUT);
    await vi.advanceTimersByTimeAsync(PITCH_BRIDGE_TIMEOUT_MS + 1);

    await expect(pending).resolves.toEqual({
      ok: false,
      code: ProfileBridgeErrorCode.Timeout,
    });
  });

  it("reports BRIDGE_INTERNAL for an invalid extension response", async () => {
    installRuntime((_id, _message, callback) =>
      callback({ ok: false, code: "UNKNOWN_ERROR" }),
    );

    const result =
      await profileBridgeClientService.captureProfile(CAPTURE_INPUT);

    expect(result).toEqual({
      ok: false,
      code: ProfileBridgeErrorCode.Internal,
    });
  });
});
