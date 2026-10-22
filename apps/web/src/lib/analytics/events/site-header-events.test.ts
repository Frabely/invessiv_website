import { describe, expect, it, vi } from "vitest";

import {
  trackSiteHeaderLanguageSwitch,
  trackSiteHeaderThemeSwitch,
} from "./site-header-events";

const mockTrackAnalyticsEvent = vi.fn();

vi.mock("@/lib/analytics/track-analytics-event", () => ({
  trackAnalyticsEvent: (...args: unknown[]) => mockTrackAnalyticsEvent(...args),
}));

describe("site header analytics events", () => {
  it("tracks language switches as a preference change", () => {
    trackSiteHeaderLanguageSwitch("en");

    expect(mockTrackAnalyticsEvent).toHaveBeenCalledWith("preference_changed", {
      type: "language",
      value: "en",
    });
  });

  it("tracks theme switches as a preference change", () => {
    trackSiteHeaderThemeSwitch("light");

    expect(mockTrackAnalyticsEvent).toHaveBeenCalledWith("preference_changed", {
      type: "theme",
      value: "light",
    });
  });
});
