import { describe, expect, it } from "vitest";
import {
  PITCH_AUDIENCE_VALUES,
  PitchAudience,
} from "@invessiv/common/constants/leads/outreach/lead-pitch-audiences";
import { PITCH_CHANNEL_LIMITS } from "@invessiv/common/constants/leads/outreach/lead-pitch-channel-limits";
import {
  PITCH_CHANNEL_VALUES,
  PitchChannel,
} from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import {
  PROFILE_SNAPSHOT_SOURCE_VALUES,
  ProfileSnapshotSource,
} from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";

describe("PitchChannel", () => {
  it("keeps the supported pitch channels stable", () => {
    expect(PitchChannel).toEqual({
      Instagram: "instagram",
      Linkedin: "linkedin",
    });
  });

  it("exposes every channel exactly once", () => {
    expect([...PITCH_CHANNEL_VALUES]).toEqual(Object.values(PitchChannel));
    expect(new Set(PITCH_CHANNEL_VALUES).size).toBe(
      PITCH_CHANNEL_VALUES.length,
    );
  });
});

describe("PitchAudience", () => {
  it("keeps the audience variants stable", () => {
    expect(PitchAudience).toEqual({
      Single: "single",
      Team: "team",
    });
  });

  it("exposes every audience exactly once", () => {
    expect([...PITCH_AUDIENCE_VALUES]).toEqual(Object.values(PitchAudience));
    expect(new Set(PITCH_AUDIENCE_VALUES).size).toBe(
      PITCH_AUDIENCE_VALUES.length,
    );
  });
});

describe("ProfileSnapshotSource", () => {
  it("keeps the snapshot sources stable", () => {
    expect(ProfileSnapshotSource).toEqual({
      BridgeApi: "bridge_api",
      BridgeDom: "bridge_dom",
      ManualPaste: "manual_paste",
    });
  });

  it("exposes every source exactly once", () => {
    expect([...PROFILE_SNAPSHOT_SOURCE_VALUES]).toEqual(
      Object.values(ProfileSnapshotSource),
    );
    expect(new Set(PROFILE_SNAPSHOT_SOURCE_VALUES).size).toBe(
      PROFILE_SNAPSHOT_SOURCE_VALUES.length,
    );
  });
});

describe("PITCH_CHANNEL_LIMITS", () => {
  it("keeps the character limits stable", () => {
    expect(PITCH_CHANNEL_LIMITS).toEqual({
      instagram: 995,
      linkedin: 8000,
    });
  });

  it("covers every pitch channel", () => {
    for (const channel of PITCH_CHANNEL_VALUES) {
      expect(PITCH_CHANNEL_LIMITS[channel]).toBeGreaterThan(0);
    }
  });
});

describe("LeadPitchErrorCode", () => {
  it("keeps the pitch error codes stable", () => {
    expect(LeadPitchErrorCode).toEqual({
      LeadNotFound: "LEAD_NOT_FOUND",
      NoProfileData: "NO_PROFILE_DATA",
      IcebreakerTooLong: "ICEBREAKER_TOO_LONG",
      TemplateInvalid: "TEMPLATE_INVALID",
      ValidationError: "VALIDATION_ERROR",
      NotConfigured: "NOT_CONFIGURED",
      AuthenticationFailed: "PROVIDER_AUTHENTICATION_FAILED",
      ModelUnavailable: "PROVIDER_MODEL_UNAVAILABLE",
      ProviderRateLimited: "PROVIDER_RATE_LIMITED",
      ProviderRejected: "PROVIDER_REJECTED",
      ProviderInvalidResponse: "PROVIDER_INVALID_RESPONSE",
      ProviderUnavailable: "PROVIDER_UNAVAILABLE",
      Internal: "PITCH_INTERNAL",
    });
  });

  it("has no duplicate codes", () => {
    const codes = Object.values(LeadPitchErrorCode);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("ProfileBridgeErrorCode", () => {
  it("keeps the bridge error codes stable", () => {
    expect(ProfileBridgeErrorCode).toEqual({
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
    });
  });

  it("has no duplicate codes", () => {
    const codes = Object.values(ProfileBridgeErrorCode);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
