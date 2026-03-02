// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactSection } from "./contact-section";

describe("ContactSection", () => {
  it("renders banner copy and both ctas", () => {
    render(
      <ContactSection
        contactCta={{
          hint: "Antwort in 24h.",
          href: "#contact",
          label: "Jetzt Projekt anfragen",
        }}
        contactChannels={[
          {
            actionLabel: "Per E-Mail anfragen",
            href: "mailto:hi@invessiv.de",
            label: "E-Mail",
            value: "hi@invessiv.de",
          },
        ]}
        contactChecklist={["Ziel", "Deadline", "Assets"]}
        contactChecklistHint="Dauert ca. 2 Minuten."
        contactChecklistTitle="In 3 kurzen Antworten starten"
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
          projectDetailsLabel: "Projektbeschreibung",
          projectDetailsPlaceholder: "Details",
          requiredHint: "* Pflichtfelder",
          roleLabel: "Rolle",
          startLabel: "Start",
          startOptions: ["Sofort"],
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
        title="Bereit fuer eine neue, produktive Website?"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Bereit fuer eine neue, produktive Website?",
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
    expect(screen.getByText("In 3 kurzen Antworten starten")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Per E-Mail anfragen" }),
    ).toBeTruthy();
  });
});
