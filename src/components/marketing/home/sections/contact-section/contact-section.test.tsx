// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactSection } from "./contact-section";

describe("ContactSection", () => {
  it("renders banner copy and both ctas", () => {
    render(
      <ContactSection
        contactCta={{
          description: "Für warme Leads mit klarem Scope.",
          hint: "Antwort in 24h.",
          href: "#contact",
          kicker: "Direkt starten",
          label: "Jetzt Projekt anfragen",
        }}
        contactChannels={[
          {
            actionLabel: "Kurze E-Mail senden",
            description: "Für mittlere Leads mit grobem Vorhaben.",
            href: "mailto:hi@invessiv.de",
            kicker: "Erst grob anfragen",
            label: "Kurze E-Mail",
            value: "hi@invessiv.de",
          },
          {
            actionLabel: "Kennenlern-Call starten",
            description: "Für frühe Leads mit Klärungsbedarf.",
            href: "tel:+4912345678",
            kicker: "Kurz abstimmen",
            label: "Kennenlern-Call",
            value: "15-20 Min. Orientierungsgespräch",
          },
        ]}
        contactChecklist={["Ziel", "Deadline", "Assets"]}
        contactChecklistHint="Dauert ca. 2 Minuten."
        contactChecklistTitle="Was du direkt erwarten kannst"
        contactDecisionIntro="Je nachdem, wie konkret dein Vorhaben ist."
        contactForm={{
          budgetLabel: "Budgetrahmen",
          budgetOptions: ["1.000 € - 2.500 €"],
          closeLabel: "Formular schließen",
          conditionalFieldHint: "Dynamische Pflichtfelder",
          companyLabel: "Unternehmen",
          consentLabel: "Ich stimme gemäß",
          emailLabel: "E-Mail",
          firstNameLabel: "Vorname",
          goalLabel: "Ziel",
          goalOptions: ["Leads"],
          intro: "Kurzbeschreibung",
          lastNameLabel: "Nachname",
          mailBodyDetailsLabel: "Details",
          mailBodyTitle: "Neue Anfrage",
          mailLabelBudget: "Budget",
          mailLabelCompany: "Firma",
          mailLabelEmail: "E-Mail",
          mailLabelName: "Name",
          mailLabelOffer: "Angebot",
          mailLabelPhone: "Telefon",
          mailLabelRole: "Rolle",
          mailLabelStart: "Start",
          mailLabelWebsite: "Website",
          mailSubjectPrefix: "Projektanfrage",
          offerLabel: "Angebot",
          offerPlaceholder: "Bitte wählen",
          pagesLabel: "Seiten",
          pagesPlaceholder: "Start, Kontakt",
          phoneLabel: "Telefon",
          previousStepLabel: "Zurück",
          projectDetailsLabel: "Projektbeschreibung",
          projectDetailsPlaceholder: "Details",
          requiredHint: "* Pflichtfelder",
          roleLabel: "Rolle",
          stepLabel: "Schritt",
          stepNavigationLabel: "Anfragefortschritt",
          stepOneTitle: "Kontakt",
          stepThreeTitle: "Rahmen",
          stepTwoTitle: "Projekt",
          startLabel: "Start",
          startOptions: ["Sofort"],
          nextStepLabel: "Weiter",
          submitLabel: "Senden",
          submitSuccess: "Gesendet",
          subtitle: "Scope-Check",
          title: "Projektanfrage",
          websiteRequiredHint: "Website erforderlich",
          websiteLabel: "Website",
          workflowLabel: "Workflows",
          workflowOptions: ["1 Workflow"],
          privacyLabel: "Datenschutzerklärung",
        }}
        contactFormOffers={[
          { key: "landing", title: "Landing pages" },
          { key: "web", title: "Webseiten" },
        ]}
        contactSecondaryCta={{
          hint: "",
          href: "#services",
          label: "Leistungen ansehen",
        }}
        description="Kontaktiere uns und starte dein Projekt mit Invessiv."
        id="contact"
        privacyHref="/privacy"
        title="Bereit für eine neue, produktive Website?"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Bereit für eine neue, produktive Website?",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Jetzt Projekt anfragen" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Leistungen ansehen" })
        .getAttribute("href"),
    ).toBe("#services");
    expect(screen.getByText("Was du direkt erwarten kannst")).toBeTruthy();
    expect(screen.getAllByText("Direkt starten").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Erst grob anfragen").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kurz abstimmen").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Kurze E-Mail senden" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Kennenlern-Call starten" }),
    ).toBeTruthy();
  });
});
