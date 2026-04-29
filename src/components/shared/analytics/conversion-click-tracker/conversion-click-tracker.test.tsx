// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConversionClickTracker } from "./conversion-click-tracker";

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

describe("ConversionClickTracker", () => {
  afterEach(() => {
    cleanup();
    mockTrackConversionEvent.mockReset();
  });

  it("tracks allowed CTA, contact, and calendar click events from data attributes", () => {
    render(
      <>
        <ConversionClickTracker />
        <a
          data-analytics-event="cta_click"
          data-analytics-location="hero"
          data-analytics-target="form"
          data-analytics-variant="primary"
          href="#contact"
        >
          CTA
        </a>
        <a
          data-analytics-event="contact_click"
          data-analytics-location="footer"
          href="mailto:service@invessiv.com"
        >
          Mail
        </a>
        <button
          data-analytics-event="calendar_click"
          data-analytics-location="contact"
          data-analytics-target="calendly"
          type="button"
        >
          Calendar
        </button>
      </>,
    );

    fireEvent.click(document.querySelector("a[href='#contact']")!);
    fireEvent.click(document.querySelector("a[href^='mailto:']")!);
    fireEvent.click(document.querySelector("button")!);

    expect(mockTrackConversionEvent).toHaveBeenCalledWith("cta_click", {
      location: "hero",
      target: "form",
      variant: "primary",
    });
    expect(mockTrackConversionEvent).toHaveBeenCalledWith("contact_click", {
      location: "footer",
      target: "email",
    });
    expect(mockTrackConversionEvent).toHaveBeenCalledWith("calendar_click", {
      location: "contact",
      target: "calendly",
    });
  });

  it("ignores unsupported events even when data attributes are present", () => {
    render(
      <>
        <ConversionClickTracker />
        <button data-analytics-event="unknown_event" type="button">
          Unknown
        </button>
      </>,
    );

    fireEvent.click(document.querySelector("button")!);

    expect(mockTrackConversionEvent).not.toHaveBeenCalled();
  });
});
