import { describe, expect, it, vi } from "vitest";

import {
  trackSiteHeaderLanguageSwitch,
  trackSiteHeaderThemeSwitch,
} from "./site-header-events";

const mockTrackConversionEvent = vi.fn();

vi.mock("@/lib/analytics/conversion-events", () => ({
  trackConversionEvent: (...args: unknown[]) =>
    mockTrackConversionEvent(...args),
}));

describe("site header analytics events", () => {
  it("tracks language switches with the header location and target locale", () => {
    trackSiteHeaderLanguageSwitch("en");

    expect(mockTrackConversionEvent).toHaveBeenCalledWith("language_switch", {
      location: "header",
      target: "en",
    });
  });

  it("tracks theme switches with the header location and target theme", () => {
    trackSiteHeaderThemeSwitch("light");

    expect(mockTrackConversionEvent).toHaveBeenCalledWith("theme_switch", {
      location: "header",
      target: "light",
    });
  });
});
