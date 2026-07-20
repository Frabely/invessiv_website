import { describe, expect, it } from "vitest";
import { normalizeLeadProfileUrl } from "@/server/workspace/leads/shared/lead-url-normalization-service";

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

  it("unifies the protocol to https", () => {
    expect(normalizeLeadProfileUrl("http://linkedin.com/in/max")).toBe(
      "https://linkedin.com/in/max",
    );
  });

  it("lowercases the host", () => {
    expect(normalizeLeadProfileUrl("https://LinkedIn.COM/in/max")).toBe(
      "https://linkedin.com/in/max",
    );
  });

  it("strips a leading www. from the host", () => {
    expect(normalizeLeadProfileUrl("https://www.linkedin.com/in/max")).toBe(
      "https://linkedin.com/in/max",
    );
  });

  it("sorts remaining non-tracking query parameters alphabetically", () => {
    expect(
      normalizeLeadProfileUrl("https://youtube.com/channel/UCxyz?b=2&a=1"),
    ).toBe("https://youtube.com/channel/UCxyz?a=1&b=2");
  });

  it("produces the same output for URLs that only differ by protocol, www. and host case", () => {
    const variantA = "http://WWW.LinkedIn.com/in/max/";
    const variantB = "https://linkedin.com/in/max";
    expect(normalizeLeadProfileUrl(variantA)).toBe(
      normalizeLeadProfileUrl(variantB),
    );
  });
});
