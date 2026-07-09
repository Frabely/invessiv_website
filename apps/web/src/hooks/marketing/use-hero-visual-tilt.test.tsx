// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useHeroVisualTilt } from "./use-hero-visual-tilt";

function TiltHarness({ enabled }: { enabled?: boolean }) {
  const shotRef = useRef<HTMLDivElement | null>(null);
  useHeroVisualTilt(shotRef, enabled);

  return <div ref={shotRef} />;
}

describe("useHeroVisualTilt", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("attaches pointer listeners by default", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");

    render(<TiltHarness />);

    expect(addEventListener).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function),
      { passive: true },
    );
  });

  it("attaches nothing when disabled", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");

    render(<TiltHarness enabled={false} />);

    const pointerCalls = addEventListener.mock.calls.filter(
      ([eventName]) => eventName === "pointermove",
    );
    expect(pointerCalls).toHaveLength(0);
  });
});
