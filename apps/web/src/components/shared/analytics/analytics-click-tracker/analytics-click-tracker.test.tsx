// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { analyticsAttributes } from "@/common/patterns/analytics/analytics-properties";
import { AnalyticsClickTracker } from "./analytics-click-tracker";

const mockTrackAnalyticsProperties = vi.fn();

vi.mock("@/lib/analytics/track-analytics-event", () => ({
  trackAnalyticsProperties: (...args: unknown[]) =>
    mockTrackAnalyticsProperties(...args),
}));

describe("AnalyticsClickTracker", () => {
  afterEach(() => {
    cleanup();
    mockTrackAnalyticsProperties.mockReset();
  });

  it("tracks clicks on elements carrying analytics attributes, including nested targets", () => {
    render(
      <>
        <AnalyticsClickTracker />
        <a
          href="#contact"
          {...analyticsAttributes("cta_clicked", {
            cta: "home_hero_primary",
            target: "contact_form",
          })}
        >
          <span>CTA</span>
        </a>
      </>,
    );

    fireEvent.click(document.querySelector("span")!);

    expect(mockTrackAnalyticsProperties).toHaveBeenCalledWith("cta_clicked", {
      cta: "home_hero_primary",
      target: "contact_form",
    });
  });

  it("ignores unknown event names and malformed payloads", () => {
    render(
      <>
        <AnalyticsClickTracker />
        <button
          data-analytics-event="cta_click"
          data-analytics-payload='{"cta":"x"}'
          type="button"
        >
          Old
        </button>
        <button
          data-analytics-event="cta_clicked"
          data-analytics-payload="not-json"
          type="button"
        >
          Broken
        </button>
      </>,
    );

    for (const button of document.querySelectorAll("button")) {
      fireEvent.click(button);
    }

    expect(mockTrackAnalyticsProperties).not.toHaveBeenCalled();
  });
});
