// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SectionReachTracker } from "./section-reach-tracker";

const mockTrackAnalyticsEvent = vi.fn();

vi.mock("@/lib/analytics/track-analytics-event", () => ({
  trackAnalyticsEvent: (...args: unknown[]) => mockTrackAnalyticsEvent(...args),
}));

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly callback: ObserverCallback;
  readonly options: IntersectionObserverInit;
  readonly observed = new Set<Element>();

  constructor(callback: ObserverCallback, options: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
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

  report(element: Element, isIntersecting: boolean, intersectionRatio = 0) {
    this.callback([{ intersectionRatio, isIntersecting, target: element }]);
  }
}

function bandObserver() {
  return MockIntersectionObserver.instances.find(
    (observer) => observer.options.rootMargin !== undefined,
  )!;
}

function fullObserver() {
  return MockIntersectionObserver.instances.find(
    (observer) => observer.options.rootMargin === undefined,
  )!;
}

function sections() {
  return (
    <>
      <section id="hero" />
      <section id="services" />
      <footer id="footer" />
    </>
  );
}

function renderTracker(sectionIds: readonly string[]) {
  return render(
    <>
      <SectionReachTracker page="home" sectionIds={sectionIds} />
      {sections()}
    </>,
  );
}

function sectionReachedCalls() {
  return mockTrackAnalyticsEvent.mock.calls.filter(
    ([name]) => name === "section_reached",
  );
}

describe("SectionReachTracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    mockTrackAnalyticsEvent.mockReset();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("tracks a section once it stayed in the viewport band for the dwell time", () => {
    renderTracker(["hero", "services", "footer"]);
    const hero = document.getElementById("hero")!;

    act(() => {
      bandObserver().report(hero, true);
      vi.advanceTimersByTime(1000);
    });

    expect(sectionReachedCalls()).toEqual([
      ["section_reached", { page: "home", section: "hero" }],
    ]);
    expect(bandObserver().observed.has(hero)).toBe(false);
    expect(fullObserver().observed.has(hero)).toBe(false);
  });

  it("ignores sections that are only scrolled past", () => {
    renderTracker(["hero", "services", "footer"]);
    const services = document.getElementById("services")!;

    act(() => {
      bandObserver().report(services, true);
      vi.advanceTimersByTime(500);
      bandObserver().report(services, false);
      vi.advanceTimersByTime(1000);
    });

    expect(sectionReachedCalls()).toHaveLength(0);
  });

  it("counts a short final section once it is fully visible", () => {
    renderTracker(["hero", "services", "footer"]);
    const footer = document.getElementById("footer")!;

    act(() => {
      fullObserver().report(footer, true, 1);
      vi.advanceTimersByTime(1000);
    });

    expect(sectionReachedCalls()).toEqual([
      ["section_reached", { page: "home", section: "footer" }],
    ]);
  });

  it("does not count a section while the tab is hidden and resumes when visible", () => {
    renderTracker(["hero", "services", "footer"]);
    const hero = document.getElementById("hero")!;
    const visibility = vi.spyOn(document, "visibilityState", "get");

    act(() => {
      bandObserver().report(hero, true);
      visibility.mockReturnValue("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(2000);
    });
    expect(sectionReachedCalls()).toHaveLength(0);

    act(() => {
      visibility.mockReturnValue("visible");
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(1000);
    });
    expect(sectionReachedCalls()).toHaveLength(1);
    visibility.mockRestore();
  });

  it("never reports a section twice when re-rendered with a new id array", () => {
    const { rerender } = renderTracker(["hero", "services", "footer"]);

    act(() => {
      bandObserver().report(document.getElementById("hero")!, true);
      vi.advanceTimersByTime(1000);
    });

    rerender(
      <>
        <SectionReachTracker page="home" sectionIds={["hero", "services"]} />
        {sections()}
      </>,
    );

    act(() => {
      const observer = MockIntersectionObserver.instances.at(-2)!;
      for (const element of observer.observed) {
        observer.report(element, true);
      }
      vi.advanceTimersByTime(1000);
    });

    expect(sectionReachedCalls().map(([, payload]) => payload.section)).toEqual(
      ["hero", "services"],
    );
  });

  it("tracks page engagement once after 30 visible seconds", () => {
    renderTracker(["hero"]);

    act(() => {
      vi.advanceTimersByTime(29_000);
    });
    expect(mockTrackAnalyticsEvent).not.toHaveBeenCalledWith(
      "page_engaged",
      expect.anything(),
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(
      mockTrackAnalyticsEvent.mock.calls.filter(
        ([name]) => name === "page_engaged",
      ),
    ).toEqual([["page_engaged", { page: "home" }]]);
  });

  it("pauses page engagement while the tab is hidden", () => {
    renderTracker(["hero"]);
    const visibility = vi.spyOn(document, "visibilityState", "get");

    act(() => {
      vi.advanceTimersByTime(20_000);
      visibility.mockReturnValue("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(60_000);
    });
    expect(mockTrackAnalyticsEvent).not.toHaveBeenCalledWith(
      "page_engaged",
      expect.anything(),
    );

    act(() => {
      visibility.mockReturnValue("visible");
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(10_000);
    });
    expect(mockTrackAnalyticsEvent).toHaveBeenCalledWith("page_engaged", {
      page: "home",
    });
    visibility.mockRestore();
  });
});
