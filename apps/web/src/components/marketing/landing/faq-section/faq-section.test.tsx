// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FaqSection } from "./faq-section";

afterEach(() => {
  cleanup();
});

const ITEMS = Array.from({ length: 8 }, (_, index) => ({
  question: `Frage ${index + 1}?`,
  answer: `Antwort ${index + 1}.`,
}));

function renderFaqSection(items = ITEMS) {
  return render(
    <FaqSection
      cta={{
        analyticsTarget: "contact",
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
});
