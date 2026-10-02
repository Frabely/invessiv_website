import { describe, expect, it } from "vitest";

import { OnboardingApiPath } from "./onboarding-api-paths";

describe("OnboardingApiPath", () => {
  it("contains the exact path segments without duplicates", () => {
    expect(OnboardingApiPath).toEqual({
      Onboarding: "onboarding",
      Blocks: "blocks",
      Fields: "fields",
      Move: "move",
      Usage: "usage",
      Release: "release",
      Review: "review",
      RequestChanges: "request-changes",
    });
    const values = Object.values(OnboardingApiPath);
    expect(new Set(values).size).toBe(values.length);
  });
});
