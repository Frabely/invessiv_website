// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useProcessJourneyMobile } from "./use-process-journey-mobile";

const VIEWPORT_HEIGHT = 800;
const STEP_COUNT = 3;

let observerCallbacks: (() => void)[] = [];

class FakeIntersectionObserver {
  constructor(callback: () => void) {
    observerCallbacks.push(callback);
  }

  observe() {}

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return [];
  }
}

function Fixture() {
  const endCtaRef = useRef<HTMLAnchorElement | null>(null);
  const stepsRef = useRef<HTMLDivElement | null>(null);
  useProcessJourneyMobile({ endCtaRef, stepsRef });

  return (
    <div>
      <div ref={stepsRef}>
        {Array.from({ length: STEP_COUNT }, (_, index) => (
          <article
            data-process-step="true"
            data-testid={`step-${index}`}
            key={index}
          />
        ))}
      </div>
      <a data-testid="cta" ref={endCtaRef}>
        Termin
      </a>
    </div>
  );
}

function setElementTop(element: HTMLElement, top: number) {
  element.getBoundingClientRect = () => ({ top, bottom: top + 100 }) as DOMRect;
}

function positionJourney(tops: number[]) {
  const targets = [
    ...Array.from({ length: STEP_COUNT }, (_, index) =>
      screen.getByTestId(`step-${index}`),
    ),
    screen.getByTestId("cta"),
  ];
  targets.forEach((target, index) => {
    setElementTop(target, tops[index] ?? VIEWPORT_HEIGHT);
  });
  observerCallbacks.forEach((callback) => {
    callback();
  });
}

function journeyStates() {
  return Array.from({ length: STEP_COUNT }, (_, index) =>
    screen.getByTestId(`step-${index}`).getAttribute("data-journey-state"),
  );
}

describe("useProcessJourneyMobile", () => {
  beforeEach(() => {
    observerCallbacks = [];
    window.innerHeight = VIEWPORT_HEIGHT;
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: FakeIntersectionObserver,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: () => ({
        matches: true,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the first step active until a later one reaches the reading line", () => {
    render(<Fixture />);

    positionJourney([600, 900, 1200, 1500]);

    expect(journeyStates()).toEqual(["active", "upcoming", "upcoming"]);
    expect(screen.getByTestId("cta").dataset.journeyActive).toBe("false");
  });

  it("marks steps above the reading line as passed", () => {
    render(<Fixture />);

    positionJourney([100, 380, 700, 1000]);

    expect(journeyStates()).toEqual(["passed", "active", "upcoming"]);
    expect(screen.getByTestId("cta").dataset.journeyActive).toBe("false");
  });

  it("hands over to the cta once it reaches the reading line", () => {
    render(<Fixture />);

    positionJourney([-400, -200, 0, 320]);

    expect(journeyStates()).toEqual(["passed", "passed", "passed"]);
    expect(screen.getByTestId("cta").dataset.journeyActive).toBe("true");
  });
});
