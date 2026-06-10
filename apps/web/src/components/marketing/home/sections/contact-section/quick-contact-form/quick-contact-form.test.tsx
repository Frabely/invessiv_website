// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuickContactForm } from "./quick-contact-form";

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({
    locale: "de",
  }),
}));

vi.mock("@/client/contact/services/contact-form-service", () => ({
  submitQuickContact: vi.fn(),
}));

vi.mock("@/lib/analytics/conversion-events", () => ({
  trackConversionEvent: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("QuickContactForm", () => {
  it("shows the required field error on blur", async () => {
    render(
      <QuickContactForm
        channel={{
          actionLabel: "E-Mail senden",
          copyLabel: "E-Mail kopieren",
          copiedLabel: "Kopiert",
          description: "Schneller Erstkontakt per E-Mail.",
          href: "mailto:hi@invessiv.de",
          kicker: "Kurz",
          label: "Kurze E-Mail",
          mode: "email",
          value: "hi@invessiv.de",
        }}
        formCopy={{
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
        privacyHref="/privacy"
      />,
    );

    const emailField = screen.getByRole("textbox", {
      name: /E-Mail/,
    });
    fireEvent.blur(emailField);

    await waitFor(() => {
      expect(screen.getByText("Pflichtfeld")).toBeTruthy();
    });
  });
});
