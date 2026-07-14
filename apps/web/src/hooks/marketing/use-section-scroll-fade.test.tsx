// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSectionScrollFade } from "./use-section-scroll-fade";

const SECTION_IDS = ["hero", "solution", "trust"] as const;

let reducedMotionMatches = false;
let sectionTops: Record<string, number> = {};

function SectionFadeHarness() {
  useSectionScrollFade(SECTION_IDS);

  return (
    <>
      {SECTION_IDS.map((sectionId) => (
        <section id={sectionId} key={sectionId}>
          {sectionId}
        </section>
      ))}
    </>
  );
}

function getSectionOpacity(sectionId: string): string {
  const section = document.getElementById(sectionId);
  if (!(section instanceof HTMLElement)) {
    throw new Error(`Expected section "${sectionId}" to be rendered`);
  }
  return section.style.opacity;
}

describe("useSectionScrollFade", () => {
  beforeEach(() => {
    reducedMotionMatches = false;
    sectionTops = { hero: 0, solution: 768, trust: 1600 };

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 768,
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
      function (this: Element) {
        const top = sectionTops[this.id] ?? 0;
        return {
          top,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          x: 0,
          y: top,
          toJSON: () => ({}),
        } as DOMRect;
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("fades each section based on the position of the following section", () => {
    render(<SectionFadeHarness />);

    expect(getSectionOpacity("hero")).toBe("1");
    expect(getSectionOpacity("solution")).toBe("1");
    expect(getSectionOpacity("trust")).toBe("");

    sectionTops = { hero: -600, solution: 480, trust: 1200 };
    fireEvent.scroll(window);
    expect(getSectionOpacity("hero")).toBe("0.675");
    expect(getSectionOpacity("solution")).toBe("1");

    sectionTops = { hero: -1400, solution: -200, trust: 307.2 };
    fireEvent.scroll(window);
    expect(getSectionOpacity("hero")).toBe("0.35");
    expect(getSectionOpacity("solution")).toBe("0.35");
    expect(getSectionOpacity("trust")).toBe("");
  });

  it("does not fade when reduced motion is preferred", () => {
    reducedMotionMatches = true;
    sectionTops = { hero: -600, solution: 300, trust: 1200 };

    render(<SectionFadeHarness />);
    fireEvent.scroll(window);

    expect(getSectionOpacity("hero")).toBe("");
    expect(getSectionOpacity("solution")).toBe("");
  });

  it("removes the fades on unmount", () => {
    sectionTops = { hero: -600, solution: 300, trust: 1200 };
    const { unmount } = render(<SectionFadeHarness />);

    expect(getSectionOpacity("hero")).toBe("0.35");

    const hero = document.getElementById("hero");
    unmount();

    expect(hero?.style.opacity).toBe("");
  });
});
