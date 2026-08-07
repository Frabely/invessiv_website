// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LANDING_PREVIEW_ANCHOR_ORDER } from "@/common/constants/marketing";
import { getLandingHeroContent } from "@/i18n/dictionaries/landing/hero";
import { getLandingProblemSolutionContent } from "@/i18n/dictionaries/landing/problem-solution";
import { LandingVisualStage } from "./landing-visual-stage";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span aria-label={alt} role="img" />,
}));

function renderStage() {
  render(
    <LandingVisualStage
      hero={<section data-testid="hero" />}
      locale="de"
      preview={getLandingHeroContent("de").preview}
      problemSolution={getLandingProblemSolutionContent("de")}
      solutionSectionId="solution"
    />,
  );
}

function rows() {
  const section = document.getElementById("solution") as HTMLElement;
  return within(within(section).getByRole("list")).getAllByRole("button");
}

function ring() {
  return screen.getByTestId("coaching-preview-highlight-overlay");
}

function mediaQueryList(matches: boolean): MediaQueryList {
  return {
    matches,
    media: "(max-width: 900px)",
    onchange: null,
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  };
}

describe("LandingVisualStage", () => {
  let intersectionCallback: IntersectionObserverCallback | null;

  beforeEach(() => {
    intersectionCallback = null;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => mediaQueryList(false)),
    });
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: class MockIntersectionObserver {
        private readonly callback: IntersectionObserverCallback;

        constructor(callback: IntersectionObserverCallback) {
          this.callback = callback;
        }

        disconnect() {}

        observe(target: Element) {
          if (target.querySelector("#solution")) {
            intersectionCallback = this.callback;
          }
        }

        unobserve() {}
      },
    });
  });

  afterEach(cleanup);

  it("keeps hero, section, and a single shared preview together", () => {
    renderStage();

    expect(screen.getByTestId("hero")).toBeTruthy();
    expect(screen.getAllByTestId("coaching-preview-browser")).toHaveLength(1);
    expect(document.getElementById("solution")).toBeTruthy();
  });

  it("gives every anchor a row that can drive the highlight", () => {
    renderStage();

    expect(rows()).toHaveLength(LANDING_PREVIEW_ANCHOR_ORDER.length);
  });

  it("stays unmarked until a row is used", () => {
    renderStage();

    expect(ring().dataset.active).toBe("false");
  });

  it("marks row and preview together, and clears both again", () => {
    renderStage();

    const [firstRow] = rows();
    fireEvent.pointerEnter(firstRow as HTMLElement, { pointerType: "mouse" });

    expect(firstRow?.dataset.active).toBe("true");
    expect(ring().dataset.active).toBe("true");

    fireEvent.pointerLeave(firstRow as HTMLElement, { pointerType: "mouse" });

    expect(firstRow?.dataset.active).toBe("false");
    expect(ring().dataset.active).toBe("false");
  });

  it("moves the highlight to the row that takes over", () => {
    renderStage();

    const [first, second] = rows();
    fireEvent.pointerEnter(first as HTMLElement, { pointerType: "mouse" });
    fireEvent.pointerEnter(second as HTMLElement, { pointerType: "mouse" });

    expect(first?.dataset.active).toBe("false");
    expect(second?.dataset.active).toBe("true");
  });

  it("keeps a clicked row selected after the mouse leaves", () => {
    renderStage();

    const [firstRow] = rows();
    fireEvent.click(firstRow as HTMLElement);
    fireEvent.pointerLeave(firstRow as HTMLElement, { pointerType: "mouse" });

    expect(firstRow?.getAttribute("aria-pressed")).toBe("true");
    expect(firstRow?.dataset.active).toBe("true");
    expect(ring().dataset.active).toBe("true");
  });

  it("keeps the mobile preview on its hero until the problem section is visible", () => {
    vi.mocked(window.matchMedia).mockReturnValue(mediaQueryList(true));
    renderStage();

    const [firstRow] = rows();
    fireEvent.click(firstRow as HTMLElement);

    expect(firstRow?.getAttribute("aria-pressed")).toBe("true");
    expect(firstRow?.dataset.active).toBe("false");
    expect(ring().dataset.active).toBe("false");

    act(() => {
      intersectionCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(firstRow?.dataset.active).toBe("true");
    expect(ring().dataset.active).toBe("true");
  });
});
