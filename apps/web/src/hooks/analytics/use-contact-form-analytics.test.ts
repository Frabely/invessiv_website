// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  useContactFormAnalytics,
  useContactFormStartTracking,
} from "./use-contact-form-analytics";

const mockTrackAnalyticsEvent = vi.fn();

vi.mock("@/lib/analytics/track-analytics-event", () => ({
  trackAnalyticsEvent: (...args: unknown[]) => mockTrackAnalyticsEvent(...args),
}));

describe("useContactFormStartTracking", () => {
  afterEach(() => {
    mockTrackAnalyticsEvent.mockReset();
  });

  it("tracks the form start only once until reset", () => {
    const { result } = renderHook(() =>
      useContactFormStartTracking("home_contact"),
    );

    act(() => {
      result.current.trackStarted();
      result.current.trackStarted();
    });

    expect(mockTrackAnalyticsEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackAnalyticsEvent).toHaveBeenCalledWith("form_started", {
      form: "contact",
      placement: "home_contact",
    });

    act(() => {
      result.current.resetStarted();
      result.current.trackStarted();
    });

    expect(mockTrackAnalyticsEvent).toHaveBeenCalledTimes(2);
  });
});

describe("useContactFormAnalytics", () => {
  afterEach(() => {
    mockTrackAnalyticsEvent.mockReset();
  });

  it("tracks submit, invalid, failure, completion and calendar with two properties each", () => {
    const { result } = renderHook(() =>
      useContactFormAnalytics({
        form: "discovery_call",
        placement: "landing_final",
      }),
    );

    act(() => {
      result.current.trackSubmitted();
      result.current.trackInvalid(["email", "consentAccepted"]);
      result.current.trackFailed("rate_limited");
      result.current.trackCompleted();
      result.current.trackCalendarOpened();
    });

    expect(mockTrackAnalyticsEvent.mock.calls).toEqual([
      [
        "form_submitted",
        { form: "discovery_call", placement: "landing_final" },
      ],
      ["form_invalid", { form: "discovery_call", field: "email" }],
      ["form_failed", { form: "discovery_call", reason: "rate_limited" }],
      [
        "form_completed",
        { form: "discovery_call", placement: "landing_final" },
      ],
      [
        "calendar_opened",
        { source: "after_submit", placement: "landing_final" },
      ],
    ]);
  });

  it("skips the invalid event when no field name is known", () => {
    const { result } = renderHook(() =>
      useContactFormAnalytics({
        form: "quick_contact",
        placement: "home_contact",
      }),
    );

    act(() => {
      result.current.trackInvalid([]);
    });

    expect(mockTrackAnalyticsEvent).not.toHaveBeenCalled();
  });
});
