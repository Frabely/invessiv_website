// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHeroVisualTilt } from "./use-hero-visual-tilt";

let desktop = true;
let finePointer = true;
let reducedMotion = false;

function TiltHarness() {
  const ref = useRef<HTMLDivElement | null>(null);
  useHeroVisualTilt(ref, {
    maximumRotation: 3,
    parallaxDistance: 0,
    restRotation: 0,
  });
  return <div data-testid="tilt-target" ref={ref} />;
}

describe("useHeroVisualTilt", () => {
  beforeEach(() => {
    desktop = true;
    finePointer = true;
    reducedMotion = false;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: desktop && finePointer && !reducedMotion,
      })),
    });
  });

  afterEach(cleanup);

  it("caps movement at three degrees and resets on pointer leave", () => {
    render(<TiltHarness />);
    const target = screen.getByTestId("tilt-target");
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerMove(window, { clientX: 1000, clientY: -1000 });
    expect(target.style.transform).toBe(
      "rotate(0deg) rotateX(3.00deg) rotateY(3.00deg)",
    );
    expect(target.style.getPropertyValue("--hero-parallax-x")).toBe("0.00px");

    fireEvent.pointerLeave(window);
    expect(target.style.transform).toBe("rotate(0deg)");
  });

  it.each([
    ["mobile", false, true, false],
    ["reduced motion", true, true, true],
  ])("stays static on %s", (_label, isDesktop, hasFinePointer, isReduced) => {
    desktop = isDesktop;
    finePointer = hasFinePointer;
    reducedMotion = isReduced;
    render(<TiltHarness />);

    const target = screen.getByTestId("tilt-target");
    fireEvent.pointerMove(window, { clientX: 1000, clientY: -1000 });
    expect(target.style.transform).toBe("");
  });
});
