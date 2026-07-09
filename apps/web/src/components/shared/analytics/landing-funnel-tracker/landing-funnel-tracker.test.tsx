// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LandingFunnelTracker } from "./landing-funnel-tracker";

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

  hasTarget(id: string) {
    return [...this.observed].some((element) => element.id === id);
  }
}

function renderSections(zoomState?: string) {
  render(
    <>
      {zoomState ? <div data-zoom-state={zoomState} /> : null}
      <LandingFunnelTracker />
      <section id="hero" />
      <section id="solution" />
      <section id="contact" />
    </>,
  );
}

describe("LandingFunnelTracker", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    mockTrackConversionEvent.mockReset();
    vi.unstubAllGlobals();
  });

  it("fires the landing page section event once per section with the section id as location", () => {
    renderSections();

    const observer = MockIntersectionObserver.instances[0]!;
    const hero = document.getElementById("hero")!;
    const solution = document.getElementById("solution")!;

    observer.enter(hero);
    observer.enter(solution);

    expect(mockTrackConversionEvent).toHaveBeenCalledTimes(2);
    expect(mockTrackConversionEvent).toHaveBeenCalledWith(
      "landing_page_section_view",
      { location: "hero" },
    );
    expect(mockTrackConversionEvent).toHaveBeenCalledWith(
      "landing_page_section_view",
      { location: "solution" },
    );
  });

  it("does not fire again when the same section re-enters the viewport", () => {
    renderSections();

    const observer = MockIntersectionObserver.instances[0]!;
    const hero = document.getElementById("hero")!;

    observer.enter(hero);
    observer.enter(hero);

    expect(mockTrackConversionEvent).toHaveBeenCalledTimes(1);
  });

  it("still tracks the hero while the zoom stage is pinned", () => {
    renderSections("pinned");

    const heroObserver = MockIntersectionObserver.instances.find((instance) =>
      instance.hasTarget("hero"),
    );

    expect(heroObserver).toBeDefined();
    heroObserver!.enter(document.getElementById("hero")!);

    expect(mockTrackConversionEvent).toHaveBeenCalledWith(
      "landing_page_section_view",
      { location: "hero" },
    );
  });

  it("does not observe gated sections while the zoom stage is pinned", () => {
    renderSections("pinned");

    const observesGated = MockIntersectionObserver.instances.some(
      (instance) =>
        instance.hasTarget("solution") || instance.hasTarget("contact"),
    );

    expect(observesGated).toBe(false);
  });
});
