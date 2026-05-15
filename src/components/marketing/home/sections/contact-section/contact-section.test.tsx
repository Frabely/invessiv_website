// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContactSection } from "./contact-section";

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({
    locale: "de",
  }),
}));

vi.mock("@/lib/analytics/conversion-events", () => ({
  trackConversionEvent: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe("ContactSection", () => {
  it("renders contact entry picker and shows only the active path panel", () => {
    render(
      <ContactSection
        contactAlternativeLabel="Weitere Kontaktwege"
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
          nameLabel: "Name",
          addPageLabel: "Seite hinzufügen",
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
          fieldErrorInvalidWebsite:
            "Ungültige Webseite, z. B. https://www.webseite.com. www.webseite.com ist ohne Protokoll ungültig.",
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
          copyActionLabel: "E-Mail kopieren",
          copiedActionLabel: "E-Mail kopiert",
          nameLabel: "Name",
          emailLabel: "E-Mail",
          messageLabel: "Nachricht",
          messagePlaceholder: "Schreib kurz dein Anliegen.",
          consentLabel: "Ich stimme gemäß",
          privacyLabel: "Datenschutzerklärung",
          submitLabel: "E-Mail senden",
          submittingLabel: "Wird gesendet",
          submitErrorRateLimited: "Rate limited",
          submitErrorDelivery: "Delivery error",
          submitErrorGeneric: "Generic error",
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
          nameLabel: "Name",
          emailLabel: "E-Mail",
          messageLabel: "Anliegen",
          messagePlaceholder: "Optionales Anliegen.",
          consentLabel: "Ich stimme gemäß",
          privacyLabel: "Datenschutzerklärung",
          submitLabel: "Termin wählen",
          submittingLabel: "Wird geöffnet",
          submitSuccess: "Calendly wird geöffnet",
          submitErrorRateLimited: "Rate limited",
          submitErrorGeneric: "Generic error",
          fieldErrorInvalidEmail: "Ungültige E-Mail",
          fieldErrorRequired: "Pflichtfeld",
          fieldErrorConsentRequired: "Zustimmung erforderlich",
          requiredHint: "* Pflichtfelder",
        }}
        contactSecondaryCta={{
          href: "#services",
          label: "Leistungen ansehen",
        }}
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
    expect(screen.getByRole("textbox", { name: /Name\s*\*/ })).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Leistungen ansehen" })
        .getAttribute("href"),
    ).toBe("#services");

    expect(
      screen.queryByRole("textbox", { name: /Nachricht\s*\*/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Kennenlern-Call starten" }),
    ).toBeNull();
    expect(screen.getAllByText("Weitere Kontaktwege").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByRole("button", { name: /Kurze E-Mail/ })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Kennenlern-Call/ }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Kurze E-Mail/ }));
    const emailPanel = screen.getByRole("region", { name: "Kurze E-Mail" });
    expect(
      within(emailPanel).getByRole("textbox", { name: /Nachricht\s*\*/ }),
    ).toBeTruthy();
    expect(
      within(emailPanel).getByRole("button", { name: "E-Mail kopieren" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Kurze E-Mail/ }));
    expect(screen.queryByRole("region", { name: "Kurze E-Mail" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Kennenlern-Call/ }));
    const callPanel = screen.getByRole("region", { name: "Kennenlern-Call" });
    expect(
      within(callPanel).getByRole("textbox", { name: /Name\s*\*/ }),
    ).toBeTruthy();
    expect(
      within(callPanel).getByRole("textbox", { name: /E-Mail\s*\*/ }),
    ).toBeTruthy();
    expect(
      within(callPanel).getByRole("textbox", { name: "Anliegen" }),
    ).toBeTruthy();
    expect(within(callPanel).getByRole("checkbox")).toBeTruthy();
  });

  it("renders contact channels even without a primary project form", () => {
    render(
      <ContactSection
        contactAlternativeLabel="Weitere Kontaktwege"
        contactChannels={[
          {
            actionLabel: "Kurze E-Mail senden",
            description: "Für schnellen Erstkontakt.",
            href: "mailto:hi@invessiv.de",
            kicker: "Kurz",
            label: "Kurze E-Mail",
            value: "hi@invessiv.de",
          },
        ]}
        contactDecisionIntro="Wähle den passenden Kontaktweg."
        contactFormOffers={[]}
        contactSecondaryCta={{
          href: "#services",
          label: "Leistungen ansehen",
        }}
        id="contact"
        privacyHref="/privacy"
        title="Kontakt"
      />,
    );

    expect(screen.getAllByText("Weitere Kontaktwege").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByRole("button", { name: /Kurze E-Mail/ }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Leistungen ansehen" }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("region", { name: "Projektanfrage" })).toBeNull();
  });
});
