// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactSection } from "./contact-section";

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({
    locale: "de",
  }),
}));

vi.mock("@/lib/analytics/conversion-events", () => ({
  trackConversionEvent: vi.fn(),
}));

describe("ContactSection", () => {
  it("renders contact entry picker and shows only the active path panel", () => {
    render(
      <ContactSection
        contactCta={{
          description: "Für warme Leads mit klarem Rahmen.",
          hint: "Antwort in 24h.",
          href: "#contact",
          kicker: "Direkt starten",
          label: "Jetzt Projekt anfragen",
        }}
        contactChannels={[
          {
            actionLabel: "Kurze E-Mail senden",
            copyLabel: "E-Mail kopieren",
            copyValue: "service@invessiv.com",
            description: "Für mittlere Leads mit grobem Vorhaben.",
            href: "mailto:hi@invessiv.de",
            kicker: "Erst grob anfragen",
            label: "Kurze E-Mail",
            value: "hi@invessiv.de",
          },
          {
            actionLabel: "Kennenlern-Call starten",
            description: "Für frühe Leads mit Klärungsbedarf.",
            href: "https://calendly.com/service-invessiv-cxf5/30min",
            kicker: "Kurz abstimmen",
            label: "Kennenlern-Call",
            value: "15-20 Min. Orientierungsgespräch",
          },
        ]}
        contactDecisionIntro="Je nachdem, wie konkret dein Vorhaben ist."
        contactForm={{
          budgetLabel: "Budgetrahmen",
          budgetOptions: [
            { key: "between_1000_2500", label: "1.000 € - 2.500 €" },
          ],
          closeLabel: "Formular schließen",
          conditionalFieldHint: "Dynamische Pflichtfelder",
          companyLabel: "Unternehmen",
          consentLabel: "Ich stimme gemäß",
          emailLabel: "E-Mail",
          firstNameLabel: "Vorname",
          addPageLabel: "Seite hinzufügen",
          lastNameLabel: "Nachname",
          goalLabel: "Ziel",
          goalOptions: [{ key: "generate_inquiries", label: "Leads" }],
          intro: "Kurzbeschreibung",
          nextStepLabel: "Weiter",
          offerLabel: "Angebot",
          offerPlaceholder: "Bitte wählen",
          pagesLabel: "Seiten",
          pagesOptions: [{ key: "home", label: "Start" }],
          pagesPlaceholder: "Start, Kontakt",
          phoneLabel: "Telefon",
          previousStepLabel: "Zurück",
          projectDetailsLabel: "Projektbeschreibung",
          projectDetailsPlaceholder: "Details",
          requiredHint: "* Pflichtfelder",
          roleLabel: "Rolle",
          startLabel: "Start",
          startOptions: [{ key: "immediately", label: "Sofort" }],
          stepLabel: "Schritt",
          stepNavigationLabel: "Anfragefortschritt",
          stepOneTitle: "Kontakt",
          stepThreeTitle: "Rahmen",
          stepTwoTitle: "Projekt",
          submitErrorDelivery: "Delivery error",
          submitErrorGeneric: "Generic error",
          submitErrorRateLimited: "Rate limited",
          submitErrorValidation: "Validation error",
          validationSummaryPrefix: "Bitte prüfen:",
          fieldErrorInvalidEmail: "Ungültige E-Mail",
          fieldErrorInvalidWebsite: "Ungültige Webseite",
          fieldErrorRequired: "Pflichtfeld",
          fieldErrorProjectDetailsRequired: "Projekt erforderlich",
          fieldErrorPagesRequired: "Seiten erforderlich",
          fieldErrorTooManyPages: "Zu viele Seiten",
          fieldErrorGoalRequired: "Ziel erforderlich",
          fieldErrorWorkflowRequired: "Workflow erforderlich",
          fieldErrorConsentRequired: "Zustimmung erforderlich",
          submitLabel: "Senden",
          submitSuccess: "Gesendet",
          submittingLabel: "Wird gesendet",
          subtitle: "Projekt-Check",
          title: "Projektanfrage",
          websiteLabel: "Webseite",
          workflowLabel: "Workflows",
          workflowOptions: [
            {
              key: "digitize_existing_process",
              label: "Bestehenden Ablauf digitalisieren",
            },
          ],
          privacyLabel: "Datenschutzerklärung",
        }}
        contactFormOffers={[
          { key: "landing", title: "Landing pages" },
          { key: "web", title: "Webseiten" },
        ]}
        quickContactForm={{
          title: "Kurze E-Mail",
          subtitle: "Schneller Kontakt",
          intro: "Kurz reicht.",
          metaLabel: "E-Mail",
          firstNameLabel: "Vorname",
          lastNameLabel: "Nachname",
          emailLabel: "E-Mail",
          messageLabel: "Nachricht",
          messagePlaceholder: "Schreib kurz dein Anliegen.",
          consentLabel: "Ich stimme gemäß",
          privacyLabel: "Datenschutzerklärung",
          mailSubject: "Kurze Anfrage",
          mailIntro: "Hallo",
          submitLabel: "E-Mail vorbereiten",
          submittingLabel: "Wird vorbereitet",
          submitSuccess: "Mail wird geöffnet",
          fieldErrorInvalidEmail: "Ungültige E-Mail",
          fieldErrorRequired: "Pflichtfeld",
          fieldErrorConsentRequired: "Zustimmung erforderlich",
          requiredHint: "* Pflichtfelder",
        }}
        discoveryCallForm={{
          title: "Kennenlern-Call",
          subtitle: "Für direkte Abstimmung mit etwas Kontext vor dem Termin.",
          intro: "Kurz vorbereiten und dann Termin wählen.",
          firstNameLabel: "Vorname",
          lastNameLabel: "Nachname",
          emailLabel: "E-Mail",
          messageLabel: "Anliegen",
          messagePlaceholder: "Optionales Anliegen.",
          consentLabel: "Ich stimme gemäß",
          privacyLabel: "Datenschutzerklärung",
          submitLabel: "Termin wählen",
          submittingLabel: "Wird geöffnet",
          submitSuccess: "Calendly wird geöffnet",
          fieldErrorInvalidEmail: "Ungültige E-Mail",
          fieldErrorRequired: "Pflichtfeld",
          fieldErrorConsentRequired: "Zustimmung erforderlich",
          requiredHint: "* Pflichtfelder",
        }}
        contactSecondaryCta={{
          href: "#services",
          label: "Leistungen ansehen",
        }}
        description="Kontaktiere uns und starte dein Projekt mit Invessiv."
        id="contact"
        privacyHref="/privacy"
        title="Bereit für eine neue, produktive Webseite?"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Bereit für eine neue, produktive Webseite?",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("region", { name: "Projektanfrage" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Vorname*" })).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Leistungen ansehen" })
        .getAttribute("href"),
    ).toBe("#services");

    expect(screen.queryByRole("textbox", { name: "Nachricht*" })).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Kennenlern-Call starten" }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: /Kurze E-Mail/ }));
    expect(screen.getByRole("textbox", { name: "Nachricht*" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "E-Mail kopieren" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: /Kennenlern-Call/ }));
    expect(screen.getByRole("textbox", { name: "Vorname*" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "E-Mail*" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Anliegen" })).toBeTruthy();
    expect(screen.getByRole("checkbox")).toBeTruthy();
  });
});
