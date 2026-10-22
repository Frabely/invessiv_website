import { describe, expect, it, vi } from "vitest";

import { trackAnalyticsEvent } from "./track-analytics-event";

const mockTrack = vi.fn();

vi.mock("@vercel/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

describe("trackAnalyticsEvent", () => {
  it("sends the event with at most two trimmed string properties", () => {
    trackAnalyticsEvent("cta_clicked", {
      cta: "home_hero_primary",
      target: "contact_form",
    });

    expect(mockTrack).toHaveBeenCalledWith("cta_clicked", {
      cta: "home_hero_primary",
      target: "contact_form",
    });
  });

  it("drops empty optional properties", () => {
    trackAnalyticsEvent("generator_step", { step: "start", reason: "" });

    expect(mockTrack).toHaveBeenLastCalledWith("generator_step", {
      step: "start",
    });
  });
});
