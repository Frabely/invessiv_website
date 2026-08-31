// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { useCallback, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStickyScrollProgress } from "./use-sticky-scroll-progress";

const TRACK_HEIGHT = 2000;
const VIEWPORT_HEIGHT = 800;

let reducedMotionMatches = false;
let trackTop = 0;
let reported: number[] = [];

function StickyScrollHarness() {
  const trackRef = useRef<HTMLElement | null>(null);
  const onProgressAction = useCallback((progress: number) => {
    reported.push(progress);
  }, []);

  useStickyScrollProgress({ trackRef, onProgressAction });

  return <section ref={trackRef}>track</section>;
}

function lastProgress(): number {
  const progress = reported.at(-1);

  if (progress === undefined) {
    throw new Error("Expected the hook to report a progress value");
  }

  return progress;
}

describe("useStickyScrollProgress", () => {
  beforeEach(() => {
    reducedMotionMatches = false;
    trackTop = 0;
    reported = [];

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: VIEWPORT_HEIGHT,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: reducedMotionMatches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          top: trackTop,
          left: 0,
          right: 0,
          bottom: trackTop + TRACK_HEIGHT,
          width: 0,
          height: TRACK_HEIGHT,
          x: 0,
          y: trackTop,
          toJSON: () => ({}),
        }) as DOMRect,
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("maps the travelled distance onto a clamped 0..1 range", () => {
    render(<StickyScrollHarness />);

    expect(lastProgress()).toBe(0);

    // The track travels 1200px before its sticky child reaches the end.
    trackTop = -600;
    fireEvent.scroll(window);
    expect(lastProgress()).toBeCloseTo(0.5, 5);

    trackTop = -1200;
    fireEvent.scroll(window);
    expect(lastProgress()).toBe(1);
  });

  it("keeps reporting after the first frame", () => {
    render(<StickyScrollHarness />);

    trackTop = -300;
    fireEvent.scroll(window);
    trackTop = -900;
    fireEvent.scroll(window);

    expect(lastProgress()).toBeCloseTo(0.75, 5);
  });

  it("clamps a track that scrolled past its end", () => {
    trackTop = -5000;

    render(<StickyScrollHarness />);

    expect(lastProgress()).toBe(1);
  });

  it("reports the end state when reduced motion is preferred", () => {
    reducedMotionMatches = true;
    trackTop = 0;

    render(<StickyScrollHarness />);

    expect(lastProgress()).toBe(1);
  });
});
