// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SuccessPage } from "./success-page";

const CONTENT = {
  backLabel: "Zurück zur Übersicht",
  body: "Ich melde mich innerhalb von 24 Stunden mit einer ehrlichen Ersteinschätzung - kostenlos und unverbindlich.",
  contactLabel: "Optional Termin buchen",
  contactLead:
    "Du musst jetzt nichts weiter tun. Wenn du willst, können wir vorher noch kurz sprechen.",
  statusLabel: "Anfrage eingegangen",
  steps: [
    {
      title: "Anfrage prüfen",
      body: "Ich schaue mir deine Angaben in Ruhe an.",
    },
    {
      title: "Einschätzung senden",
      body: "Du bekommst innerhalb von 24 Stunden eine persönliche Rückmeldung.",
    },
    {
      title: "Nächsten Schritt wählen",
      body: "Wenn es passt, legen wir gemeinsam los.",
    },
  ],
  stepsLabel: "Wie es weitergeht",
  title: "Danke, deine Anfrage ist bei mir.",
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
        name: "Danke, deine Anfrage ist bei mir.",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Anfrage eingegangen")).toBeTruthy();
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
    expect(within(steps[0]).getByText("Anfrage prüfen")).toBeTruthy();
    expect(within(steps[1]).getByText(/innerhalb von 24 Stunden/)).toBeTruthy();
    expect(within(steps[2]).getByText("Nächsten Schritt wählen")).toBeTruthy();
  });

  it("does not render the email copy block", () => {
    renderSuccessPage();

    expect(screen.queryByText("Noch etwas nachreichen?")).toBeNull();
    expect(screen.queryByText("service@invessiv.com")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "E-Mail-Adresse kopieren" }),
    ).toBeNull();
  });

  it("links the direct appointment CTA to the given href, opened in a new tab", () => {
    renderSuccessPage();

    const contact = screen.getByRole("link", {
      name: "Optional Termin buchen",
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
