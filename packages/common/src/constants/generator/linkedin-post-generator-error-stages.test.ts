import { describe, expect, it } from "vitest";
import { LinkedInPostGeneratorErrorStage } from "./linkedin-post-generator-error-stages";

describe("LinkedInPostGeneratorErrorStage", () => {
  it("contains the expected usage limit stages", () => {
    expect(LinkedInPostGeneratorErrorStage).toEqual({
      UsageLimitReserve: "usage_limit_reserve",
      UsageLimitUnknown: "usage_limit_unknown",
    });
    expect(new Set(Object.values(LinkedInPostGeneratorErrorStage)).size).toBe(
      Object.values(LinkedInPostGeneratorErrorStage).length,
    );
  });
});
