import { afterEach, describe, expect, it, vi } from "vitest";
import { isConsumptionReferenceEnabled } from "./marketing-launch";

describe("isConsumptionReferenceEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when the flag is missing", () => {
    expect(isConsumptionReferenceEnabled()).toBe(false);
  });

  it("returns false when the flag is not set to true", () => {
    vi.stubEnv("ENABLE_MARKETING_REFERENCE_CONSUMPTION", "false");

    expect(isConsumptionReferenceEnabled()).toBe(false);
  });

  it("returns true when the flag is set to true", () => {
    vi.stubEnv("ENABLE_MARKETING_REFERENCE_CONSUMPTION", "true");

    expect(isConsumptionReferenceEnabled()).toBe(true);
  });
});
