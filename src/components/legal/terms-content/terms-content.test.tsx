// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TermsContent } from "./terms-content";

const buildLongText = (seed: string) =>
  Array.from({ length: 20 })
    .map((_, index) => `${seed} Satz ${index + 1} mit zusätzlichem Detail für lange Leseblöcke.`)
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

describe("TermsContent", () => {
  const replaceStateSpy = vi.spyOn(window.history, "replaceState");
  const writeTextSpy = vi.fn(() => Promise.resolve());
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

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: writeTextSpy },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewMock,
    });
    replaceStateSpy.mockReset();
    writeTextSpy.mockClear();
    matchMediaMock.mockClear();
    scrollIntoViewMock.mockClear();
    window.history.replaceState(null, "", "/de/terms");
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    cleanup();
  });

  it("renders toc entries twice (mobile + desktop) and all long content sections", () => {
    render(
      <TermsContent
        copySectionLinkLabel="Link kopieren"
        sectionLinkCopiedLabel="Kopiert"
        sections={sectionData}
        tocLabel="Inhalt"
      />,
    );

    expect(screen.getAllByRole("navigation", { name: "Inhalt" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "1. Anbieter" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "2. Geltungsbereich" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "3. Leistungen" })).toHaveLength(2);
    expect(screen.getByText(/Anbietertext Satz 20/)).toBeTruthy();
    expect(screen.getByText(/Leistungen Satz 19/)).toBeTruthy();
  });

  it("scrolls and updates hash when clicking a toc link", () => {
    render(
      <TermsContent
        copySectionLinkLabel="Link kopieren"
        sectionLinkCopiedLabel="Kopiert"
        sections={sectionData}
        tocLabel="Inhalt"
      />,
    );

    const navs = screen.getAllByRole("navigation", { name: "Inhalt" });
    const desktopLink = within(navs[1]).getByRole("link", { name: "2. Geltungsbereich" });

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

    render(
      <TermsContent
        copySectionLinkLabel="Link kopieren"
        sectionLinkCopiedLabel="Kopiert"
        sections={sectionData}
        tocLabel="Inhalt"
      />,
    );

    fireEvent.click(screen.getAllByRole("link", { name: "3. Leistungen" })[0]);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("copies section link and resets copied label after timeout", async () => {
    render(
      <TermsContent
        copySectionLinkLabel="Link kopieren"
        sectionLinkCopiedLabel="Kopiert"
        sections={sectionData}
        tocLabel="Inhalt"
      />,
    );

    const copyButton = screen.getByRole("button", { name: "Link kopieren: 2. Geltungsbereich" });
    fireEvent.click(copyButton);

    expect(writeTextSpy).toHaveBeenCalledWith(`${window.location.origin}/de/terms#scope`);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole("button", { name: "Link kopieren: 2. Geltungsbereich" }).textContent).toBe(
      "Kopiert",
    );
    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "#scope");

    await act(async () => {
      vi.advanceTimersByTime(1800);
    });
    expect(screen.getByRole("button", { name: "Link kopieren: 2. Geltungsbereich" }).textContent).toBe(
      "Link kopieren",
    );
  });

  it("keeps copy label unchanged when clipboard write fails", async () => {
    writeTextSpy.mockImplementationOnce(() => Promise.reject(new Error("clipboard blocked")));

    render(
      <TermsContent
        copySectionLinkLabel="Link kopieren"
        sectionLinkCopiedLabel="Kopiert"
        sections={sectionData}
        tocLabel="Inhalt"
      />,
    );

    const copyButton = screen.getByRole("button", { name: "Link kopieren: 3. Leistungen" });
    fireEvent.click(copyButton);
    await Promise.resolve();

    expect(copyButton.textContent).toBe("Link kopieren");
  });

  it("renders nothing when no sections are provided", () => {
    const { container } = render(
      <TermsContent
        copySectionLinkLabel="Link kopieren"
        sectionLinkCopiedLabel="Kopiert"
        sections={[]}
        tocLabel="Inhalt"
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
