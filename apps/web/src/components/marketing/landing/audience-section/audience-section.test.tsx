// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AudienceSection } from "./audience-section";

const CONTENT = {
  body: "Eine Landingpage kann neue Kunden bringen — oder neue Mitarbeiter.",
  cta: {
    analyticsTarget: "contact",
    helper: "Nicht sicher?",
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
});
