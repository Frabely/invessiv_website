// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LANDING_PAGE_SECTION_VIEW_EVENT } from "@/common/constants/analytics/conversion-event-names";
import type { LandingFunnelSectionId } from "@/config/navigation/landing";

import { useSectionFunnelTracking } from "./use-section-funnel-tracking";

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

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly observed = new Set<Element>();
  readonly callback: ObserverCallback;

  constructor(callback: ObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.add(element);
  }

  unobserve(element: Element) {
    this.observed.delete(element);
  }

  disconnect() {
    this.observed.clear();
  }

  enter(element: Element) {
    this.callback([{ isIntersecting: true, target: element }]);
  }
}

const SECTION_IDS: readonly LandingFunnelSectionId[] = ["solution", "contact"];

function TrackingHarness({ enabled }: { enabled: boolean }) {
  useSectionFunnelTracking(
    LANDING_PAGE_SECTION_VIEW_EVENT,
    SECTION_IDS,
    enabled,
  );

  return (
    <>
      <section id="solution" />
      <section id="contact" />
    </>
  );
}

describe("useSectionFunnelTracking", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    mockTrackConversionEvent.mockReset();
    vi.unstubAllGlobals();
  });

  it("creates no observer while disabled", () => {
    render(<TrackingHarness enabled={false} />);

    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });

  it("starts observing once enabled and fires each section once", () => {
    const { rerender } = render(<TrackingHarness enabled={false} />);

    rerender(<TrackingHarness enabled />);

    const observer = MockIntersectionObserver.instances[0]!;
    const solution = document.getElementById("solution")!;

    observer.enter(solution);
    observer.enter(solution);

    expect(mockTrackConversionEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackConversionEvent).toHaveBeenCalledWith(
      "landing_page_section_view",
      { location: "solution" },
    );
  });
});
