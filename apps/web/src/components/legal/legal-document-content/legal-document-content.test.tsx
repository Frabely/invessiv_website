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
import { LegalDocumentContent } from "./legal-document-content";

const buildLongText = (seed: string) =>
  Array.from({ length: 20 })
    .map(
      (_, index) =>
        `${seed} Satz ${index + 1} mit zusätzlichem Detail für lange Leseblöcke.`,
    )
    .join(" ");

const sectionData = [
  {
    id: "provider",
    title: "1. Anbieter",
    body: <p>{buildLongText("Anbietertext")}</p>,
  },
  {
    id: "scope",
    title: "2. Geltungsbereich",
    body: <p>{buildLongText("Geltungsbereich")}</p>,
  },
  {
    id: "services",
    title: "3. Leistungen",
    body: <p>{buildLongText("Leistungen")}</p>,
  },
];

const createLongTocSections = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `section-${index + 1}`,
    title: `${index + 1}. Abschnitt`,
    body: <p>{buildLongText(`Abschnitt ${index + 1}`)}</p>,
  }));

describe("LegalDocumentContent", () => {
  const replaceStateSpy = vi.spyOn(window.history, "replaceState");
  const matchMediaMock = vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    dispatchEvent: vi.fn(),
  }));
  const scrollIntoViewMock = vi.fn();
  let mockScrollY = 0;
  let requestAnimationFrameMock: ReturnType<typeof vi.spyOn> | null = null;
  let cancelAnimationFrameMock: ReturnType<typeof vi.spyOn> | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewMock,
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    mockScrollY = 0;
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => mockScrollY,
    });
    requestAnimationFrameMock = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
    cancelAnimationFrameMock = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => undefined);
    replaceStateSpy.mockReset();
    matchMediaMock.mockClear();
    scrollIntoViewMock.mockClear();
    window.history.replaceState(null, "", "/de/terms");
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    requestAnimationFrameMock?.mockRestore();
    cancelAnimationFrameMock?.mockRestore();
    cleanup();
  });

  it("renders toc entries twice (mobile + desktop) and all long content sections", () => {
    render(<LegalDocumentContent sections={sectionData} tocLabel="Inhalt" />);

    expect(screen.getAllByRole("navigation", { name: "Inhalt" })).toHaveLength(
      2,
    );
    expect(screen.getAllByRole("link", { name: "1. Anbieter" })).toHaveLength(
      2,
    );
    expect(
      screen.getAllByRole("link", { name: "2. Geltungsbereich" }),
    ).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "3. Leistungen" })).toHaveLength(
      2,
    );
    expect(screen.getByText(/Anbietertext Satz 20/)).toBeTruthy();
    expect(screen.getByText(/Leistungen Satz 19/)).toBeTruthy();
  });

  it("scrolls and updates hash when clicking a toc link", () => {
    render(<LegalDocumentContent sections={sectionData} tocLabel="Inhalt" />);

    const navs = screen.getAllByRole("navigation", { name: "Inhalt" });
    const desktopLink = within(navs[1]).getByRole("link", {
      name: "2. Geltungsbereich",
    });

    fireEvent.click(desktopLink);

    const targetSection = document.getElementById("scope");
    expect(targetSection).toBeTruthy();
    expect(targetSection?.matches(":focus")).toBe(true);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "#scope");
  });

  it("uses non-animated scroll when reduced motion is enabled", () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      dispatchEvent: vi.fn(),
    });

    render(<LegalDocumentContent sections={sectionData} tocLabel="Inhalt" />);

    fireEvent.click(screen.getAllByRole("link", { name: "3. Leistungen" })[0]);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("renders nothing when no sections are provided", () => {
    const { container } = render(
      <LegalDocumentContent sections={[]} tocLabel="Inhalt" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("keeps desktop toc fixed under header while scrolling and pins it at content end", () => {
    render(
      <LegalDocumentContent
        sections={createLongTocSections(30)}
        tocLabel="Inhalt"
      />,
    );

    const navs = screen.getAllByRole("navigation", { name: "Inhalt" });
    const desktopToc = navs[1] as HTMLElement;
    const tocColumn = desktopToc.parentElement as HTMLElement;
    const article = tocColumn.nextElementSibling as HTMLElement;

    const columnTopInDocument = 200;
    const articleBottomInDocument = 5000;
    const columnLeft = 48;
    const columnWidth = 260;

    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this === tocColumn) {
          return {
            x: columnLeft,
            y: columnTopInDocument - mockScrollY,
            top: columnTopInDocument - mockScrollY,
            bottom: columnTopInDocument - mockScrollY + 600,
            left: columnLeft,
            right: columnLeft + columnWidth,
            width: columnWidth,
            height: 600,
            toJSON: () => ({}),
          };
        }
        if (this === article) {
          return {
            x: 340,
            y: 220 - mockScrollY,
            top: 220 - mockScrollY,
            bottom: articleBottomInDocument - mockScrollY,
            left: 340,
            right: 1200,
            width: 860,
            height: articleBottomInDocument - 220,
            toJSON: () => ({}),
          };
        }
        return {
          x: 0,
          y: 0,
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          toJSON: () => ({}),
        };
      });
    const offsetHeightSpy = vi
      .spyOn(desktopToc, "offsetHeight", "get")
      .mockReturnValue(1200);

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    act(() => {
      mockScrollY = 4300;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(desktopToc.className).toContain("desktopTocBottom");
    expect(desktopToc.style.getPropertyValue("--desktop-toc-max-height")).toBe(
      "680px",
    );
    expect(
      Number.parseInt(
        desktopToc.style.getPropertyValue("--desktop-toc-bottom-top"),
        10,
      ),
    ).toBeGreaterThanOrEqual(0);

    rectSpy.mockRestore();
    offsetHeightSpy.mockRestore();
  });

  it("uses quiet mode for mobile toc while reading and restores visibility on upward scroll", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });

    render(<LegalDocumentContent sections={sectionData} tocLabel="Inhalt" />);

    const mobileSummary = screen
      .getAllByText("Inhalt")
      .find(
        (element) => element.tagName.toLowerCase() === "summary",
      ) as HTMLElement;
    const mobileToc = mobileSummary.closest("details") as HTMLElement;
    expect(mobileToc.className).not.toContain("mobileTocQuiet");

    act(() => {
      mockScrollY = 180;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(mobileToc.className).toContain("mobileTocQuiet");

    act(() => {
      mockScrollY = 130;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(mobileToc.className).not.toContain("mobileTocQuiet");
  });

  it("keeps mobile toc visible when the toc sheet is open", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });

    render(<LegalDocumentContent sections={sectionData} tocLabel="Inhalt" />);

    const mobileSummary = screen
      .getAllByText("Inhalt")
      .find(
        (element) => element.tagName.toLowerCase() === "summary",
      ) as HTMLElement;
    const mobileToc = mobileSummary.closest("details") as HTMLElement;

    act(() => {
      mockScrollY = 180;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(mobileToc.className).toContain("mobileTocQuiet");

    mobileToc.setAttribute("open", "");
    fireEvent(mobileToc, new Event("toggle"));

    act(() => {
      mockScrollY = 260;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(mobileToc.className).not.toContain("mobileTocQuiet");
  });
});
