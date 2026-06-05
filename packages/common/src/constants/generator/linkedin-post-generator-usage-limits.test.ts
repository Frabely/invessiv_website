import { describe, expect, it } from "vitest";
import {
  LINKEDIN_POST_DELIVERY_USAGE_LIMIT_MAX,
  LINKEDIN_POST_DELIVERY_USAGE_LIMIT_SCOPE,
  LINKEDIN_POST_DELIVERY_USAGE_LIMIT_WINDOW_MS,
  LINKEDIN_POST_GENERATOR_USAGE_LIMIT_MAX,
  LINKEDIN_POST_GENERATOR_USAGE_LIMIT_SCOPE,
  LINKEDIN_POST_GENERATOR_USAGE_LIMIT_WINDOW_MS,
} from "./linkedin-post-generator-usage-limits";

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

describe("LinkedIn post delivery usage limits", () => {
  it("uses a separate scope so the generation counter stays untouched", () => {
    expect(LINKEDIN_POST_DELIVERY_USAGE_LIMIT_SCOPE).toBe(
      "linkedin-post-delivery",
    );
    expect(LINKEDIN_POST_DELIVERY_USAGE_LIMIT_SCOPE).not.toBe(
      LINKEDIN_POST_GENERATOR_USAGE_LIMIT_SCOPE,
    );
  });

  it("allows generous headroom for retries within the 30-day window", () => {
    expect(LINKEDIN_POST_DELIVERY_USAGE_LIMIT_MAX).toBe(10);
    expect(LINKEDIN_POST_DELIVERY_USAGE_LIMIT_WINDOW_MS).toBe(
      30 * 24 * 60 * 60 * 1000,
    );
  });
});
