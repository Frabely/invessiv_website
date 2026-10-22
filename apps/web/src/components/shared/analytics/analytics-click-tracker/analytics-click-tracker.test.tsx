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

  it("counts middle-clicks only on links and does not duplicate ordinary clicks", () => {
    const attributes = analyticsAttributes("reference_opened", {
      project: "example",
      target: "references",
    });
    const { unmount } = render(
      <>
        <AnalyticsClickTracker />
        <a href="https://example.com/reference" {...attributes}>
          <span>Reference</span>
        </a>
        <button type="button" {...attributes}>
          Button
        </button>
      </>,
    );
    const target = document.querySelector("span")!;
    fireEvent(target, new MouseEvent("auxclick", { bubbles: true, button: 1 }));
    expect(mockTrackAnalyticsProperties).toHaveBeenCalledTimes(1);
    fireEvent(target, new MouseEvent("auxclick", { bubbles: true, button: 2 }));
    fireEvent(
      document.querySelector("button")!,
      new MouseEvent("auxclick", { bubbles: true, button: 1 }),
    );
    expect(mockTrackAnalyticsProperties).toHaveBeenCalledTimes(1);
    fireEvent.click(target, { ctrlKey: true });
    fireEvent.click(target, { metaKey: true });
    fireEvent.click(target, { detail: 0 });
    expect(mockTrackAnalyticsProperties).toHaveBeenCalledTimes(4);
    unmount();
    fireEvent(target, new MouseEvent("auxclick", { bubbles: true, button: 1 }));
    expect(mockTrackAnalyticsProperties).toHaveBeenCalledTimes(4);
  });
});
