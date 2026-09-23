import { afterEach, describe, expect, it, vi } from "vitest";

import { FeatureFlag, isFeatureEnabled } from "@/config/feature-flags";

vi.mock("server-only", () => ({}));

describe("isFeatureEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is off when the env var is unset", () => {
    vi.stubEnv("FEATURE_PORTAL_ENABLED", "");
    expect(isFeatureEnabled(FeatureFlag.Portal)).toBe(false);
  });

  it("is off for any value other than the literal string true", () => {
    vi.stubEnv("FEATURE_PORTAL_ENABLED", "1");
    expect(isFeatureEnabled(FeatureFlag.Portal)).toBe(false);
  });

  it("is on only for the literal string true", () => {
    vi.stubEnv("FEATURE_PORTAL_ENABLED", "true");
    expect(isFeatureEnabled(FeatureFlag.Portal)).toBe(true);
  });
});
