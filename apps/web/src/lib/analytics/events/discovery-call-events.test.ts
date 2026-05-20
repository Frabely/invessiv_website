import { describe, expect, it, vi } from "vitest";

import { trackDiscoveryCallCalendarClick } from "./discovery-call-events";

const mockTrackConversionEvent = vi.fn();

vi.mock("@/lib/analytics/conversion-events", () => ({
  trackConversionEvent: (...args: unknown[]) =>
    mockTrackConversionEvent(...args),
}));

describe("discovery call analytics events", () => {
  it("tracks calendar clicks with the discovery call payload", () => {
    trackDiscoveryCallCalendarClick();

    expect(mockTrackConversionEvent).toHaveBeenCalledWith("calendar_click", {
      form_id: "discovery_call",
      location: "contact",
      target: "calendly",
      variant: "primary",
    });
  });
});
