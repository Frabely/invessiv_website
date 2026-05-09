import { describe, expect, it } from "vitest";
import { normalizeLeadProfileUrl } from "@/server/workspace/leads/utils/lead-url-normalization-service";

describe("normalizeLeadProfileUrl", () => {
  it("removes utm_* tracking parameters", () => {
    expect(
      normalizeLeadProfileUrl(
        "https://instagram.com/max?utm_source=bio&utm_medium=story",
      ),
    ).toBe("https://instagram.com/max");
  });

  it("removes fbclid parameter", () => {
    expect(
      normalizeLeadProfileUrl("https://instagram.com/max?fbclid=abc123def"),
    ).toBe("https://instagram.com/max");
  });

  it("keeps non-tracking query parameters", () => {
    expect(
      normalizeLeadProfileUrl(
        "https://youtube.com/channel/UCxyz?sub_confirmation=1",
      ),
    ).toBe("https://youtube.com/channel/UCxyz?sub_confirmation=1");
  });

  it("removes trailing slash from path", () => {
    expect(
      normalizeLeadProfileUrl("https://linkedin.com/in/max-mustermann/"),
    ).toBe("https://linkedin.com/in/max-mustermann");
  });

  it("removes multiple trailing slashes from path", () => {
    expect(
      normalizeLeadProfileUrl("https://linkedin.com/in/max-mustermann///"),
    ).toBe("https://linkedin.com/in/max-mustermann");
  });

  it("trims surrounding whitespace from the input", () => {
    expect(normalizeLeadProfileUrl("  https://linkedin.com/in/max  ")).toBe(
      "https://linkedin.com/in/max",
    );
  });

  it("removes mixed tracking params and trailing slash simultaneously", () => {
    expect(
      normalizeLeadProfileUrl(
        "https://instagram.com/max/?utm_source=bio&fbclid=abc",
      ),
    ).toBe("https://instagram.com/max");
  });

  it("produces the same output for URLs that differ only by tracking params", () => {
    const withTracking =
      "https://instagram.com/max?utm_source=bio&utm_campaign=launch&fbclid=abc";
    const withoutTracking = "https://instagram.com/max";
    expect(normalizeLeadProfileUrl(withTracking)).toBe(
      normalizeLeadProfileUrl(withoutTracking),
    );
  });

  it("preserves the root path without adding a trailing slash", () => {
    expect(normalizeLeadProfileUrl("https://example.com/")).toBe(
      "https://example.com/",
    );
  });
});
