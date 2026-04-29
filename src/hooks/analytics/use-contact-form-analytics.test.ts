// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useContactFormAnalytics } from "./use-contact-form-analytics";

const mockTrackConversionEvent = vi.fn();

vi.mock("@/lib/analytics/conversion-events", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/analytics/conversion-events")>();

  return {
    ...actual,
    trackConversionEvent: (...args: unknown[]) =>
      mockTrackConversionEvent(...args),
  };
});

describe("useContactFormAnalytics", () => {
  afterEach(() => {
    mockTrackConversionEvent.mockReset();
  });

  it("tracks form start only once until reset", () => {
    const { result } = renderHook(() =>
      useContactFormAnalytics({
        formId: "project_request",
        location: "contact",
      }),
    );

    act(() => {
      result.current.trackFormStart();
      result.current.trackFormStart();
    });

    expect(mockTrackConversionEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackConversionEvent).toHaveBeenCalledWith("form_start", {
      form_id: "project_request",
      location: "contact",
      target: "form",
      variant: "primary",
    });

    act(() => {
      result.current.resetFormAnalytics();
      result.current.trackFormStart({ step: "details" });
    });

    expect(mockTrackConversionEvent).toHaveBeenCalledTimes(2);
    expect(mockTrackConversionEvent).toHaveBeenLastCalledWith("form_start", {
      form_id: "project_request",
      location: "contact",
      step: "details",
      target: "form",
      variant: "primary",
    });
  });

  it("tracks submit attempt, success, and error payloads", () => {
    const { result } = renderHook(() =>
      useContactFormAnalytics({
        formId: "discovery_call",
        location: "contact",
        target: "calendly",
        variant: "secondary",
      }),
    );

    act(() => {
      result.current.trackSubmitAttempt({ step: "calendar" });
      result.current.trackSubmitSuccess();
      result.current.trackSubmitError("delivery");
    });

    expect(mockTrackConversionEvent).toHaveBeenCalledWith("form_start", {
      form_id: "discovery_call",
      location: "contact",
      step: "calendar",
      target: "calendly",
      variant: "secondary",
    });
    expect(mockTrackConversionEvent).toHaveBeenCalledWith(
      "form_submit_attempt",
      {
        form_id: "discovery_call",
        location: "contact",
        step: "calendar",
        target: "calendly",
        variant: "secondary",
      },
    );
    expect(mockTrackConversionEvent).toHaveBeenCalledWith(
      "lead_submit_success",
      {
        form_id: "discovery_call",
        location: "contact",
        target: "calendly",
        variant: "secondary",
      },
    );
    expect(mockTrackConversionEvent).toHaveBeenCalledWith("form_submit_error", {
      error_type: "delivery",
      form_id: "discovery_call",
      location: "contact",
      target: "calendly",
      variant: "secondary",
    });
  });
});
