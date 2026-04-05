import { afterEach, describe, expect, it, vi } from "vitest";
import { isMarketingProofEnabled } from "./marketing-launch";

describe("isMarketingProofEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when the flag is missing", () => {
    expect(isMarketingProofEnabled()).toBe(false);
  });

  it("returns false when the flag is not set to true", () => {
    vi.stubEnv("ENABLE_MARKETING_PROOF", "false");

    expect(isMarketingProofEnabled()).toBe(false);
  });

  it("returns true when the flag is set to true", () => {
    vi.stubEnv("ENABLE_MARKETING_PROOF", "true");

    expect(isMarketingProofEnabled()).toBe(true);
  });
});
