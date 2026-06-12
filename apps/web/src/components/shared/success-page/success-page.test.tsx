// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SuccessPage } from "./success-page";

const CONTENT = {
  backLabel: "Zurück zur Übersicht",
  body: "Ich melde mich innerhalb von 24 Stunden mit einer ehrlichen Ersteinschätzung — kostenlos und unverbindlich.",
  contactLabel: "Direkten Termin buchen",
  contactLead: "Lieber kurz sprechen statt schreiben?",
  hintBody:
    "Überleg dir kurz: Was soll die Seite erreichen? Gibt es eine bestehende Website, die ich anschauen soll?",
  hintLabel: "Gut zu wissen",
  statusLabel: "Anfrage zugestellt",
  steps: [
    { title: "Anfrage lesen", body: "Ich lese deine Anfrage in Ruhe." },
    {
      title: "Ersteinschätzung erhalten",
      body: "Du bekommst innerhalb von 24 Stunden eine persönliche Einschätzung.",
    },
    { title: "Du entscheidest", body: "Ob wir starten, liegt bei dir." },
  ],
  stepsLabel: "Wie es weitergeht",
  title: "Danke für deine Anfrage.",
};

const CONTACT_HREF = "https://calendly.com/service-invessiv-cxf5/30min";

function renderSuccessPage() {
  return render(
    <SuccessPage
      backHref="/de/services/landing-page"
      contactHref={CONTACT_HREF}
      {...CONTENT}
    />,
  );
}

describe("SuccessPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the confirmation as page heading with delivery status and body", () => {
    renderSuccessPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Danke für deine Anfrage.",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Anfrage zugestellt")).toBeTruthy();
    expect(
      screen.getByText(/24 Stunden mit einer ehrlichen Ersteinschätzung/),
    ).toBeTruthy();
  });

  it("renders all next steps as an ordered list with numerals and copy", () => {
    renderSuccessPage();

    expect(
      screen.getByRole("heading", { level: 2, name: "Wie es weitergeht" }),
    ).toBeTruthy();

    const steps = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(within(steps[0]).getByText("01")).toBeTruthy();
    expect(within(steps[0]).getByText("Anfrage lesen")).toBeTruthy();
    expect(within(steps[1]).getByText(/innerhalb von 24 Stunden/)).toBeTruthy();
    expect(within(steps[2]).getByText("Du entscheidest")).toBeTruthy();
  });

  it("renders the preparation hint with its label", () => {
    renderSuccessPage();

    expect(screen.getByText("Gut zu wissen")).toBeTruthy();
    expect(screen.getByText(/Was soll die Seite erreichen\?/)).toBeTruthy();
  });

  it("links the direct appointment CTA to the given href, opened in a new tab", () => {
    renderSuccessPage();

    const contact = screen.getByRole("link", {
      name: "Direkten Termin buchen",
    });
    expect(contact.getAttribute("href")).toBe(CONTACT_HREF);
    expect(contact.getAttribute("target")).toBe("_blank");
    expect(contact.getAttribute("rel")).toBe("noreferrer");
  });

  it("links the back link to the given href", () => {
    renderSuccessPage();

    const back = screen.getByRole("link", { name: /Zurück zur Übersicht/ });
    expect(back.getAttribute("href")).toBe("/de/services/landing-page");
  });
});
