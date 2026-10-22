// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("@/lib/analytics/track-analytics-event", () => ({
  trackAnalyticsEvent: track,
}));

import type { LandingFaqItem } from "@/i18n/dictionaries/landing/faq";
import { FaqSection } from "./faq-section";

afterEach(() => {
  cleanup();
  track.mockClear();
});

const ITEMS: LandingFaqItem[] = Array.from({ length: 8 }, (_, index) => ({
  question: `Frage ${index + 1}?`,
  answer: `Antwort ${index + 1}.`,
}));

function renderFaqSection(items: LandingFaqItem[] = ITEMS) {
  return render(
    <FaqSection
      cta={{
        href: "#contact",
        label: "Frage nicht dabei? Schreib mir kurz, worum es geht.",
      }}
      eyebrow="Häufige Fragen"
      id="faq"
      items={items}
      locale="de"
      showLessLabel="Weniger Fragen anzeigen"
      showMoreLabel="Mehr Fragen anzeigen"
      title="Was du dich jetzt vielleicht fragst."
    />,
  );
}

function listItemFor(question: string) {
  return screen.getByText(question).closest("li");
}

describe("FaqSection", () => {
  it("tracks actual openings, including expanded questions, and ignores closing", () => {
    renderFaqSection();
    const details = screen.getByText("Frage 1?").closest("details")!;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    expect(track.mock.calls).toEqual([
      ["faq_opened", { page: "landing", question: "faq-question-1" }],
    ]);
    details.open = false;
    fireEvent(details, new Event("toggle"));
    expect(track).toHaveBeenCalledTimes(1);
    fireEvent.click(
      screen.getByRole("button", { name: "Mehr Fragen anzeigen" }),
    );
    const expanded = screen.getByText("Frage 6?").closest("details")!;
    expanded.open = true;
    fireEvent(expanded, new Event("toggle"));
    expect(track).toHaveBeenLastCalledWith("faq_opened", {
      page: "landing",
      question: "faq-question-6",
    });
  });
  it("zeigt initial fünf Fragen, der Rest bleibt im Markup versteckt", () => {
    renderFaqSection();

    expect(listItemFor("Frage 1?")?.hidden).toBe(false);
    expect(listItemFor("Frage 5?")?.hidden).toBe(false);
    expect(listItemFor("Frage 6?")?.hidden).toBe(true);
    expect(listItemFor("Frage 8?")?.hidden).toBe(true);
  });

  it("zeigt nach Klick auf den Toggle alle Fragen und kann sie wieder einklappen", () => {
    renderFaqSection();

    const showMoreButton = screen.getByRole("button", {
      name: "Mehr Fragen anzeigen",
    });
    expect(showMoreButton.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen.queryByRole("link", {
        name: "Frage nicht dabei? Schreib mir kurz, worum es geht.",
      }),
    ).toBeNull();

    fireEvent.click(showMoreButton);

    expect(listItemFor("Frage 6?")?.hidden).toBe(false);
    expect(listItemFor("Frage 8?")?.hidden).toBe(false);
    const showLessButton = screen.getByRole("button", {
      name: "Weniger Fragen anzeigen",
    });
    expect(showLessButton.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByRole("link", {
        name: "Frage nicht dabei? Schreib mir kurz, worum es geht.",
      }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", {
          name: "Frage nicht dabei? Schreib mir kurz, worum es geht.",
        })
        .closest("p")?.dataset.visible,
    ).toBe("true");

    fireEvent.click(showLessButton);

    expect(listItemFor("Frage 6?")?.hidden).toBe(true);
    expect(listItemFor("Frage 8?")?.hidden).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Mehr Fragen anzeigen" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    expect(
      screen.queryByRole("link", {
        name: "Frage nicht dabei? Schreib mir kurz, worum es geht.",
      }),
    ).toBeNull();
  });

  it("rendert keinen Show-More-Button, wenn alle Fragen ohnehin sichtbar sind", () => {
    renderFaqSection(ITEMS.slice(0, 5));

    expect(listItemFor("Frage 5?")?.hidden).toBe(false);
    expect(
      screen.queryByRole("button", { name: "Mehr Fragen anzeigen" }),
    ).toBeNull();
  });

  it("trackt den Ausstiegslink als Navigation aus der FAQ", () => {
    renderFaqSection([
      {
        question: "Für wen ist das nicht geeignet?",
        answer: "Wenn dein Angebot noch unklar ist.",
        link: {
          label: "Schau dir meine Leistungen an",
          href: "/de#services",
        },
      },
    ]);

    const exitLink = screen.getByRole("link", {
      name: "Schau dir meine Leistungen an",
    });
    expect(exitLink.getAttribute("href")).toBe("/de#services");
    expect(exitLink.dataset.analyticsEvent).toBe("nav_clicked");
    expect(JSON.parse(exitLink.dataset.analyticsPayload ?? "{}")).toEqual({
      item: "services",
      area: "faq",
    });
  });

  it("leitet das Navigationsziel aus dem Linkpfad ab", () => {
    renderFaqSection([
      {
        question: "Frage mit Unterseite?",
        answer: "Antwort.",
        link: { label: "Mehr lesen", href: "/de/info" },
      },
    ]);

    const link = screen.getByRole("link", { name: "Mehr lesen" });
    expect(JSON.parse(link.dataset.analyticsPayload ?? "{}")).toEqual({
      item: "info",
      area: "faq",
    });
  });
});
