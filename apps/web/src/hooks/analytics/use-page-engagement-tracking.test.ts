// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePageEngagementTracking } from "./use-page-engagement-tracking";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("@/lib/analytics/track-analytics-event", () => ({
  trackAnalyticsEvent: track,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  track.mockClear();
});

describe("page engagement lifecycle", () => {
  it("completes exactly once after a delayed timer is cancelled by a visibility change", () => {
    vi.useFakeTimers();
    let elapsed = 0;
    vi.spyOn(performance, "now").mockImplementation(() => elapsed);
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("visible");
    renderHook(() => usePageEngagementTracking("home"));
    act(() => {
      elapsed = 31_000;
      visibility.mockReturnValue("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(track).not.toHaveBeenCalled();
    act(() => {
      visibility.mockReturnValue("visible");
      document.dispatchEvent(new Event("visibilitychange"));
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(60_000);
    });
    expect(track.mock.calls).toEqual([["page_engaged", { page: "home" }]]);
  });

  it("does not report after unmount", () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => usePageEngagementTracking("home"));
    unmount();
    act(() => vi.advanceTimersByTime(60_000));
    expect(track).not.toHaveBeenCalled();
  });
});
