// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AudienceSection } from "./audience-section";

/**
 * jsdom ships no `matchMedia`, so the hook falls back to desktop by default.
 * Installing a stub flips the section into its bottom-sheet behaviour.
 */
function useSheetViewport() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

const CONTENT = {
  body: "Eine Landingpage kann neue Kunden bringen. Wähl deine Branche.",
  bodyHighlight: "Wähl deine Branche",
  closeLabel: "Schließen",
  cta: {
    analyticsTarget: "contact",
    href: "#contact",
    label: "Kostenlose Ersteinschätzung anfragen",
  },
  eyebrow: "Für wen",
  items: [
    {
      detail: {
        headline: "Aufträge sind da. Die Leute fehlen.",
        outcome: "Eine Seite, die zeigt, wie bei euch gearbeitet wird.",
        problems: ["Anzeige sieht aus wie alle.", "Nichts über den Betrieb."],
      },
      iconKey: "hammer" as const,
      label: "Handwerker",
    },
    {
      detail: {
        headline: "Deine Kanzlei kann acht Rechtsgebiete.",
        outcome: "Eine Seite pro Anlass.",
        problems: ["Mandant hat genau einen Fall.", "Kosten stehen nirgends."],
      },
      iconKey: "scales" as const,
      label: "Anwälte",
    },
  ],
  outcomeLabel: "Was die Seite dann leisten muss",
  title: "Erkennst du dich wieder?",
};

function renderSection() {
  return render(<AudienceSection {...CONTENT} id="audience" locale="de" />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AudienceSection", () => {
  it("renders every audience as a button", () => {
    renderSection();

    const [pillList] = screen.getAllByRole("list");
    expect(within(pillList).getAllByRole("button")).toHaveLength(2);
  });

  it("opens the first audience by default", () => {
    renderSection();

    const first = screen.getByRole("button", { name: /Handwerker/ });
    expect(first.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByText("Aufträge sind da. Die Leute fehlen."),
    ).toBeTruthy();
    expect(screen.getByText("Anzeige sieht aus wie alle.")).toBeTruthy();
    expect(screen.getByText(CONTENT.outcomeLabel)).toBeTruthy();
  });

  it("switches the panel content when another audience is clicked", () => {
    renderSection();

    const first = screen.getByRole("button", { name: /Handwerker/ });
    const second = screen.getByRole("button", { name: /Anwälte/ });
    fireEvent.click(second);

    expect(second.getAttribute("aria-expanded")).toBe("true");
    expect(first.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen.getByText("Deine Kanzlei kann acht Rechtsgebiete."),
    ).toBeTruthy();
    expect(
      screen.queryByText("Aufträge sind da. Die Leute fehlen."),
    ).toBeNull();
  });

  it("collapses when the active audience is clicked again", () => {
    renderSection();

    const first = screen.getByRole("button", { name: /Handwerker/ });
    fireEvent.click(first);

    expect(first.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen.queryByText("Aufträge sind da. Die Leute fehlen."),
    ).toBeNull();
  });

  it("links each button to the panel it controls", () => {
    renderSection();

    const first = screen.getByRole("button", { name: /Handwerker/ });
    const panelId = first.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;

    expect(panel).toBeTruthy();
    expect(panel?.getAttribute("aria-labelledby")).toBe(first.id);
  });

  it("tracks the selection with a locale independent target", () => {
    renderSection();

    const second = screen.getByRole("button", { name: /Anwälte/ });
    expect(second.dataset.analyticsEvent).toBe("audience_select");
    expect(second.dataset.analyticsLocation).toBe("audience");
    expect(second.dataset.analyticsTarget).toBe("scales");
  });

  it("highlights the call to action inside the intro copy", () => {
    renderSection();

    const highlight = screen.getByText(CONTENT.bodyHighlight);
    expect(highlight.tagName).toBe("SPAN");
    expect(highlight.closest("p")?.textContent).toBe(CONTENT.body);
  });

  it("keeps the cta inside the detail on desktop and opens no dialog", () => {
    renderSection();

    expect(screen.queryByRole("dialog")).toBeNull();
    const cta = screen.getByRole("link", { name: CONTENT.cta.label });
    expect(cta.getAttribute("href")).toBe("#contact");
    expect(cta.dataset.analyticsEvent).toBe("cta_click");
  });
});

/** Renders the section, opens the sheet from the Anwälte pill, returns the pill. */
function openSheet() {
  renderSection();
  const pill = screen.getByRole("button", { name: /Anwälte/ });
  fireEvent.click(pill);
  return pill;
}

function getDragHandle(): HTMLElement {
  const handle = screen.getByRole("dialog").firstElementChild;
  if (!(handle instanceof HTMLElement)) {
    throw new Error("drag handle missing");
  }
  return handle;
}

/**
 * Drives a drag over a controlled duration. The clock is frozen rather than
 * advanced per call, so it does not matter whether React's scheduler reads it
 * in between — only the two values the gesture sees matter.
 */
function dragHandle(
  handle: HTMLElement,
  fromY: number,
  toY: number,
  durationMs: number,
) {
  let now = 0;
  const clock = vi.spyOn(performance, "now").mockImplementation(() => now);

  fireEvent.pointerDown(handle, { clientY: fromY, pointerId: 1 });
  fireEvent.pointerMove(handle, { clientY: toY, pointerId: 1 });
  now = durationMs;
  fireEvent.pointerUp(handle, { clientY: toY, pointerId: 1 });

  clock.mockRestore();
}

describe("AudienceSection on a sheet-sized viewport", () => {
  it("opens a modal sheet instead of the inline panel", () => {
    useSheetViewport();
    renderSection();

    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Anwälte/ }));

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(
      within(dialog).getByText("Deine Kanzlei kann acht Rechtsgebiete."),
    ).toBeTruthy();
    expect(
      within(dialog).getByRole("link", { name: CONTENT.cta.label }),
    ).toBeTruthy();
  });

  it("labels the sheet with the headline it shows", () => {
    useSheetViewport();
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: /Handwerker/ }));

    const dialog = screen.getByRole("dialog");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    const headline = labelledBy ? document.getElementById(labelledBy) : null;
    expect(headline?.textContent).toBe("Aufträge sind da. Die Leute fehlen.");
  });

  it("closes on escape and returns focus to the pill that opened it", () => {
    useSheetViewport();
    renderSection();

    const pill = screen.getByRole("button", { name: /Anwälte/ });
    fireEvent.click(pill);
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(pill);
  });

  it("dismisses when the handle is dragged far enough", () => {
    useSheetViewport();
    const pill = openSheet();
    const handle = getDragHandle();

    dragHandle(handle, 0, 200, 400);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(pill);
  });

  it("dismisses on a short but fast flick", () => {
    useSheetViewport();
    openSheet();
    const handle = getDragHandle();

    dragHandle(handle, 0, 60, 40);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("snaps back when the drag stays short", () => {
    useSheetViewport();
    openSheet();
    const handle = getDragHandle();

    dragHandle(handle, 0, 40, 600);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(dialog.style.getPropertyValue("--sheet-drag")).toBe("0px");
  });

  it("tracks the pointer while dragging", () => {
    useSheetViewport();
    openSheet();
    const handle = getDragHandle();

    fireEvent.pointerDown(handle, { clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 55, pointerId: 1 });

    const dialog = screen.getByRole("dialog");
    expect(dialog.style.getPropertyValue("--sheet-drag")).toBe("55px");
    expect(dialog.dataset.dragging).toBe("true");
  });

  it("ignores upward dragging", () => {
    useSheetViewport();
    openSheet();
    const handle = getDragHandle();

    fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 20, pointerId: 1 });

    expect(
      screen.getByRole("dialog").style.getPropertyValue("--sheet-drag"),
    ).toBe("0px");
  });

  it("offers a labelled close control", () => {
    useSheetViewport();
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: /Handwerker/ }));

    const close = screen.getByRole("button", { name: CONTENT.closeLabel });
    fireEvent.click(close);

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
