import { describe, expect, it } from "vitest";

import { sanitizeAnalyticsUrl } from "./analytics-url";

const ORIGIN = "https://invessiv.com";

describe("sanitizeAnalyticsUrl", () => {
  it("keeps allowed utm parameters and drops everything else", () => {
    expect(
      sanitizeAnalyticsUrl(
        "https://invessiv.com/de?utm_source=LinkedIn&utm_campaign=2026-10-post&ref=abc#contact",
        ORIGIN,
      ),
    ).toBe(
      "https://invessiv.com/de?utm_source=linkedin&utm_campaign=2026-10-post",
    );
  });

  it("drops utm values that do not match the allowed pattern", () => {
    expect(
      sanitizeAnalyticsUrl(
        "https://invessiv.com/de?utm_campaign=max%40example.com&utm_content=hello%20world&utm_source=linkedin",
        ORIGIN,
      ),
    ).toBe("https://invessiv.com/de?utm_source=linkedin");
  });

  it("removes query and hash when no campaign parameters are present", () => {
    expect(
      sanitizeAnalyticsUrl(
        "https://invessiv.com/en/references?x=1#top",
        ORIGIN,
      ),
    ).toBe("https://invessiv.com/en/references");
  });

  it("drops events for api routes and sensitive query keys", () => {
    expect(
      sanitizeAnalyticsUrl(
        "https://invessiv.com/de/api/public/contact",
        ORIGIN,
      ),
    ).toBeNull();
    expect(
      sanitizeAnalyticsUrl(
        "https://invessiv.com/de?email=max@example.com",
        ORIGIN,
      ),
    ).toBeNull();
  });
});
