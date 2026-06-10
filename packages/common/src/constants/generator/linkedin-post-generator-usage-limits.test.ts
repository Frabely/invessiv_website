import { describe, expect, it } from "vitest";
import {
  LINKEDIN_POST_GENERATOR_USAGE_LIMIT_MAX,
  LINKEDIN_POST_GENERATOR_USAGE_LIMIT_SCOPE,
  LINKEDIN_POST_GENERATOR_USAGE_LIMIT_WINDOW_MS,
} from "@invessiv/common";

describe("LinkedIn post generator usage limits", () => {
  it("keeps the public generator limit at two runs per 30 days", () => {
    expect(LINKEDIN_POST_GENERATOR_USAGE_LIMIT_MAX).toBe(2);
    expect(LINKEDIN_POST_GENERATOR_USAGE_LIMIT_SCOPE).toBe(
      "linkedin-post-generator",
    );
    expect(LINKEDIN_POST_GENERATOR_USAGE_LIMIT_WINDOW_MS).toBe(
      30 * 24 * 60 * 60 * 1000,
    );
  });
});
