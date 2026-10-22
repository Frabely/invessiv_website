import { describe, expect, it } from "vitest";

import {
  analyticsAttributes,
  isAnalyticsEventName,
  parseAnalyticsPayloadAttribute,
  sanitizeAnalyticsProperties,
} from "./analytics-properties";

describe("analytics properties", () => {
  it("recognises only the current event names", () => {
    expect(isAnalyticsEventName("cta_clicked")).toBe(true);
    expect(isAnalyticsEventName("cta_click")).toBe(false);
    expect(isAnalyticsEventName(undefined)).toBe(false);
  });

  it("keeps at most two trimmed, non-empty string properties", () => {
    expect(
      sanitizeAnalyticsProperties({
        empty: " ",
        first: " a ",
        number: 1,
        second: "b",
        third: "c",
      }),
    ).toEqual({ first: "a", second: "b" });
    expect(sanitizeAnalyticsProperties({ long: "x".repeat(256) })).toEqual({});
  });

  it("round-trips typed payloads through data attributes", () => {
    const attributes = analyticsAttributes("cta_clicked", {
      cta: "home_hero_primary",
      target: "contact_form",
    });

    expect(attributes["data-analytics-event"]).toBe("cta_clicked");
    expect(
      parseAnalyticsPayloadAttribute(attributes["data-analytics-payload"]),
    ).toEqual({ cta: "home_hero_primary", target: "contact_form" });
  });

  it("rejects malformed payload attributes", () => {
    expect(parseAnalyticsPayloadAttribute(undefined)).toBeNull();
    expect(parseAnalyticsPayloadAttribute("nope")).toBeNull();
    expect(parseAnalyticsPayloadAttribute("[1]")).toBeNull();
  });
});
