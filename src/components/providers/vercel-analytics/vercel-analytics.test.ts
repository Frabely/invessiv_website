// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { handleBeforeSend, sanitizeAnalyticsUrl } from "./vercel-analytics";

describe("Vercel Analytics URL sanitizing", () => {
  it("removes query strings and hashes from allowed pageview URLs", () => {
    expect(
      sanitizeAnalyticsUrl(
        "https://www.invessiv.com/de/landing?utm_source=test#preise",
      ),
    ).toBe("https://www.invessiv.com/de/landing");
  });

  it("drops sensitive routes and sensitive query keys", () => {
    expect(
      sanitizeAnalyticsUrl("https://www.invessiv.com/api/public/contact"),
    ).toBeNull();
    expect(
      sanitizeAnalyticsUrl("https://www.invessiv.com/de?email=max@example.com"),
    ).toBeNull();
    expect(
      sanitizeAnalyticsUrl("https://www.invessiv.com/de?signature=abc"),
    ).toBeNull();
  });

  it("returns a sanitized beforeSend event without mutating the original", () => {
    const event: Parameters<typeof handleBeforeSend>[0] = {
      url: "https://www.invessiv.com/en/projects?ref=newsletter#case",
    } as Parameters<typeof handleBeforeSend>[0];

    expect(handleBeforeSend(event)).toEqual({
      url: "https://www.invessiv.com/en/projects",
    });
    expect(event.url).toBe(
      "https://www.invessiv.com/en/projects?ref=newsletter#case",
    );
  });
});
