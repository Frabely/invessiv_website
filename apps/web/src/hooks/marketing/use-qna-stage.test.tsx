// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useQnaStage } from "./use-qna-stage";

const SECTION_HEIGHT = 2000;
const VIEWPORT_HEIGHT = 800;

let reducedMotionMatches = false;
let sectionTop = 0;

function QnaStageHarness() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useQnaStage({ sectionRef });

  return (
    <section id="faq" ref={sectionRef}>
      Q&A
    </section>
  );
}

function getSection(): HTMLElement {
  const section = document.getElementById("faq");

  if (!(section instanceof HTMLElement)) {
    throw new Error("Expected the Q&A section to be rendered");
  }

  return section;
}

describe("useQnaStage", () => {
  beforeEach(() => {
    reducedMotionMatches = false;
    sectionTop = 0;

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
          top: sectionTop,
          left: 0,
          right: 0,
          bottom: sectionTop + SECTION_HEIGHT,
          width: 0,
          height: SECTION_HEIGHT,
          x: 0,
          y: sectionTop,
          toJSON: () => ({}),
        }) as DOMRect,
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("walks the stage from the opening question to the question board", () => {
    render(<QnaStageHarness />);

    const section = getSection();
    expect(section.dataset.qnaAnimated).toBe("true");
    expect(section.dataset.qnaPhase).toBe("question");

    // Travel range is 1200px, so the opening question holds well past a third.
    sectionTop = -400;
    fireEvent.scroll(window);
    expect(section.dataset.qnaPhase).toBe("question");

    sectionTop = -540;
    fireEvent.scroll(window);
    expect(section.dataset.qnaPhase).toBe("handover");

    sectionTop = -900;
    fireEvent.scroll(window);
    expect(section.dataset.qnaPhase).toBe("board");
    expect(section.style.getPropertyValue("--qna-stage-progress")).toBe(
      "0.750",
    );
  });

  it("keeps the board on stage when reduced motion is preferred", () => {
    reducedMotionMatches = true;

    render(<QnaStageHarness />);

    const section = getSection();
    expect(section.dataset.qnaAnimated).toBeUndefined();
    expect(section.dataset.qnaPhase).toBe("board");

    sectionTop = 0;
    fireEvent.scroll(window);
    expect(section.dataset.qnaPhase).toBe("board");
  });

  it("hands the section back untouched on unmount", () => {
    const { unmount } = render(<QnaStageHarness />);
    const section = getSection();

    expect(section.dataset.qnaAnimated).toBe("true");

    unmount();

    expect(section.dataset.qnaAnimated).toBeUndefined();
  });
});
