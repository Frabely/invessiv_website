// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReadingProgress } from "./reading-progress";

describe("ReadingProgress", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(
      () => undefined,
    );
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 250,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("sets the initial page reading progress", () => {
    const { container } = render(<ReadingProgress />);

    const bar = container.querySelector("span");

    expect(bar).toBeInstanceOf(HTMLSpanElement);
    expect((bar as HTMLSpanElement).style.transform).toBe("scaleX(0.5)");
  });

  it("updates the bar transform when the viewport changes", () => {
    const { container } = render(<ReadingProgress />);

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 400,
    });
    window.dispatchEvent(new Event("resize"));

    const bar = container.querySelector("span");

    expect((bar as HTMLSpanElement).style.transform).toBe("scaleX(0.8)");
  });
});
