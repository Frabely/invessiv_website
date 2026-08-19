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
  return within(within(section).getByRole("list"))
    .getAllByRole("listitem")
    .map((item) => item.firstElementChild as HTMLElement);
}

function ring() {
  return screen.getByTestId("coaching-preview-highlight-overlay");
}

let intersectionCallback: IntersectionObserverCallback | null;

function setProblemSectionInView(isIntersecting: boolean) {
  act(() => {
    intersectionCallback?.(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

const TAP_TOGGLE_MEDIA_QUERY =
  "(max-width: 900px), (hover: none) and (pointer: coarse)";

function mediaQueryList(matches: boolean, media: string): MediaQueryList {
  return {
    matches,
    media,
    onchange: null,
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  };
}

function setTapLayout(usesTapToggle: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) =>
      mediaQueryList(usesTapToggle && query === TAP_TOGGLE_MEDIA_QUERY, query),
    ),
  });
}

describe("LandingVisualStage", () => {
  beforeEach(() => {
    intersectionCallback = null;
    setTapLayout(false);
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
    setProblemSectionInView(true);

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
    setProblemSectionInView(true);

    const [first, second] = rows();
    fireEvent.pointerEnter(first as HTMLElement, { pointerType: "mouse" });
    fireEvent.pointerEnter(second as HTMLElement, { pointerType: "mouse" });

    expect(first?.dataset.active).toBe("false");
    expect(second?.dataset.active).toBe("true");
  });

  it("keeps keyboard focus active after the pointer leaves", () => {
    renderStage();
    setProblemSectionInView(true);

    const [firstRow] = rows();
    fireEvent.pointerEnter(firstRow as HTMLElement, { pointerType: "mouse" });
    fireEvent.click(firstRow as HTMLElement);
    fireEvent.focus(firstRow as HTMLElement);
    fireEvent.pointerLeave(firstRow as HTMLElement, { pointerType: "mouse" });

    expect(firstRow?.hasAttribute("aria-expanded")).toBe(false);
    expect(firstRow?.dataset.active).toBe("true");
    expect(ring().dataset.active).toBe("true");

    fireEvent.blur(firstRow as HTMLElement);

    expect(firstRow?.dataset.active).toBe("false");
    expect(ring().dataset.active).toBe("false");
  });

  it("keeps a tapped row selected until it is tapped again", () => {
    setTapLayout(true);
    renderStage();
    setProblemSectionInView(true);

    const [firstRow] = rows();
    fireEvent.click(firstRow as HTMLElement);

    expect(firstRow?.getAttribute("aria-expanded")).toBe("true");
    expect(firstRow?.dataset.active).toBe("true");
    expect(screen.getByTestId("problem-solution-mobile-preview")).toBeTruthy();
    expect(screen.getAllByTestId("coaching-preview-browser")).toHaveLength(1);
    expect(
      within(screen.getByTestId("problem-solution-mobile-preview")).getByTestId(
        "coaching-preview-highlight-overlay",
      ).dataset.active,
    ).toBe("true");

    fireEvent.click(firstRow as HTMLElement);

    expect(firstRow?.getAttribute("aria-expanded")).toBe("false");
    expect(firstRow?.dataset.active).toBe("false");
    expect(screen.queryByTestId("problem-solution-mobile-preview")).toBeNull();
  });

  it("moves the tapped selection to another row", () => {
    setTapLayout(true);
    renderStage();
    setProblemSectionInView(true);

    const [firstRow, secondRow] = rows();
    fireEvent.click(firstRow as HTMLElement);
    fireEvent.click(secondRow as HTMLElement);

    expect(firstRow?.getAttribute("aria-expanded")).toBe("false");
    expect(secondRow?.getAttribute("aria-expanded")).toBe("true");
    expect(secondRow?.dataset.active).toBe("true");
  });

  it("keeps an inline selection visible independently of sticky-section visibility", () => {
    setTapLayout(true);
    renderStage();

    const [firstRow] = rows();
    fireEvent.click(firstRow as HTMLElement);

    expect(firstRow?.getAttribute("aria-expanded")).toBe("true");
    expect(firstRow?.dataset.active).toBe("true");
    expect(
      within(screen.getByTestId("problem-solution-mobile-preview")).getByTestId(
        "coaching-preview-highlight-overlay",
      ).dataset.active,
    ).toBe("true");

    setProblemSectionInView(true);

    expect(firstRow?.dataset.active).toBe("true");
    expect(
      within(screen.getByTestId("problem-solution-mobile-preview")).getByTestId(
        "coaching-preview-highlight-overlay",
      ).dataset.active,
    ).toBe("true");
  });
});
