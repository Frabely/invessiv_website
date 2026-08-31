// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  ContactFormCopy,
  ContactPortraitCopy,
} from "@/i18n/dictionaries/marketing/home";
import { ContactSection } from "./contact-section";

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({
    locale: "de",
  }),
}));

vi.mock("@/client/contact/services/contact-form-service", () => ({
  createCalendlyPrefillHref: vi.fn(() => "https://calendly.test/booking"),
  submitDiscoveryCall: vi.fn(),
  submitQuickContact: vi.fn(),
}));

vi.mock("@/lib/analytics/conversion-events", () => ({
  trackConversionEvent: vi.fn(),
}));

afterEach(() => {
  cleanup();
  window.location.hash = "";
});

const PORTRAIT: ContactPortraitCopy = {
  imageAlt: "Porträt von Moritz Hecht",
};

const FORM_COPY: ContactFormCopy = {
  nameLabel: "Name",
  emailLabel: "E-Mail",
  projectScopeLabel: "Leistungsmodell (optional)",
  projectScopeOptions: {
    landing_page: "Landingpage",
    compact_website: "Kompakte Website",
    business_website: "Business Website",
  },
  messageLabel: "Worum geht es? (optional)",
  messagePlaceholder: "Zwei Sätze reichen.",
  consentLabel: "Ich stimme gemäß",
  privacyLabel: "Datenschutzerklärung",
  privacySuffix: " zu.",
  requiredHint: "* Pflichtfelder",
  honeypotLabel: "Bitte nicht ausfüllen",
  fieldErrorInvalidEmail: "Ungültige E-Mail",
  fieldErrorRequired: "Pflichtfeld",
  fieldErrorConsentRequired: "Zustimmung erforderlich",
  submitErrorRateLimited: "Rate limited",
  submitErrorGeneric: "Generic error",
  callSubmitLabel: "Weiter zur Terminauswahl",
  callSubmittingLabel: "Terminauswahl wird geöffnet",
  callSubmitSuccess: "Terminauswahl öffnet sich",
  emailQuestion: "Doch lieber schreiben?",
  emailNote: "Formular per Mail, Antwort in 24 Stunden.",
  emailSubmitLabel: "Anfrage senden",
  emailSubmittingLabel: "Wird gesendet",
  emailSubmitSuccess: "Anfrage ist da.",
  emailSubmitErrorDelivery: "Zustellung fehlgeschlagen",
};

function renderContactSection() {
  return render(
    <ContactSection
      calendlyHref="https://calendly.com/service-invessiv-cxf5/30min"
      contactForm={FORM_COPY}
      eyebrow="Kontakt"
      id="contact"
      intro="30 Minuten, unverbindlich."
      portrait={PORTRAIT}
      privacyHref="/privacy"
      title="Lass uns über dein Vorhaben sprechen."
    />,
  );
}

describe("ContactSection", () => {
  it("renders exactly one Calendly contact form", () => {
    renderContactSection();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Lass uns über dein Vorhaben sprechen.",
      }),
    ).toBeTruthy();
    expect(document.querySelectorAll("form")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Weiter zur Terminauswahl" }),
    ).toBeTruthy();
  });

  it("renders the portrait card with the identity block", () => {
    renderContactSection();

    expect(screen.getByAltText("Porträt von Moritz Hecht")).toBeTruthy();
    expect(screen.getByText("Moritz Hecht")).toBeTruthy();
    expect(screen.queryByText("Klarer nächster Schritt")).toBeNull();
  });

  it("offers the direct contact channels in the portrait card", () => {
    renderContactSection();

    expect(
      screen
        .getByRole("link", { name: "E-Mail schreiben" })
        .getAttribute("href"),
    ).toBe("mailto:service@invessiv.com");
    expect(
      screen.getByRole("link", { name: "Anrufen" }).getAttribute("href"),
    ).toBe("tel:+4915232070477");

    const linkedin = screen.getByRole("link", {
      name: "LinkedIn-Profil öffnen",
    });
    expect(linkedin.getAttribute("href")).toBe(
      "https://www.linkedin.com/in/moritz-hecht-4a5200235/",
    );
    expect(linkedin.getAttribute("rel")).toBe("noreferrer");
  });

  it("tracks the direct channels as contact clicks", () => {
    renderContactSection();

    const emailLink = screen.getByRole("link", { name: "E-Mail schreiben" });
    expect(emailLink.getAttribute("data-analytics-event")).toBe(
      "contact_click",
    );
    expect(emailLink.getAttribute("data-analytics-location")).toBe("contact");
    expect(emailLink.getAttribute("data-analytics-target")).toBe("email");

    expect(
      screen
        .getByRole("link", { name: "Anrufen" })
        .getAttribute("data-analytics-target"),
    ).toBe("phone");
  });

  it("focuses the form when arriving from the #contact-email hash", () => {
    window.location.hash = "#contact-email";
    renderContactSection();

    expect((document.activeElement as HTMLInputElement | null)?.name).toBe(
      "displayName",
    );
  });

  it("focuses the form when an anchor to #contact-email is clicked", () => {
    renderContactSection();

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "#contact-email");
    document.body.appendChild(anchor);
    fireEvent.click(anchor);

    expect((document.activeElement as HTMLInputElement | null)?.name).toBe(
      "displayName",
    );
    anchor.remove();
  });

  it("no longer renders the project request form", () => {
    renderContactSection();

    expect(screen.queryByText("Budgetrahmen")).toBeNull();
    expect(screen.queryByText(/Projektanfrage/)).toBeNull();
  });
});
