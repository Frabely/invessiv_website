import { describe, expect, it } from "vitest";
import { createCtaClickEvent } from "@/lib/telemetry/events";

describe("createCtaClickEvent", () => {
  it("returns a normalized CTA click payload", () => {
    const event = createCtaClickEvent({
      kind: "primary",
      placement: " home_hero ",
      target: " /kontakt ",
    });

    expect(event.event).toBe("cta_click");
    expect(event.kind).toBe("primary");
    expect(event.placement).toBe("home_hero");
    expect(event.target).toBe("/kontakt");
    expect(Number.isNaN(Date.parse(event.timestamp))).toBe(false);
  });
});
