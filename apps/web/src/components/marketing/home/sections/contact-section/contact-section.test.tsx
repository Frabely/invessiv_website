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
  points: ["30 Minuten", "Unverbindlich", "Klarer nächster Schritt"],
};

const FORM_COPY: ContactFormCopy = {
  nameLabel: "Name",
  emailLabel: "E-Mail",
  projectScopeLabel: "Leistungsmodell",
  projectScopeOptions: {
    landing_page: "Landingpage",
    compact_website: "Kompakte Website",
    business_website: "Business Website",
    unsure: "Noch unsicher",
  },
  messageLabel: "Worum geht es? (optional)",
  messagePlaceholder: "Zwei Sätze reichen.",
  consentLabel: "Ich stimme gemäß",
  privacyLabel: "Datenschutzerklärung",
  requiredHint: "* Pflichtfelder",
  fieldErrorInvalidEmail: "Ungültige E-Mail",
  fieldErrorRequired: "Pflichtfeld",
  fieldErrorConsentRequired: "Zustimmung erforderlich",
  submitErrorRateLimited: "Rate limited",
  submitErrorGeneric: "Generic error",
  callSubmitLabel: "Weiter zur Terminauswahl",
  callSubmittingLabel: "Terminauswahl wird geöffnet",
  callSubmitSuccess: "Terminauswahl öffnet sich",
  emailQuestion: "Lieber schreiben statt sprechen?",
  emailNote:
    "Das ausgefüllte Formular geht als E-Mail an mich. Ich antworte in der Regel innerhalb von 24 Stunden.",
  emailSubmitLabel: "Anfrage senden",
  emailSubmittingLabel: "Wird gesendet",
  emailSubmitSuccess: "Anfrage gesendet.",
  emailSubmitErrorDelivery: "Delivery error",
};

function renderContactSection() {
  return render(
    <ContactSection
      calendlyHref="https://calendly.com/service-invessiv-cxf5/30min"
      contactForm={FORM_COPY}
      id="contact"
      intro="30 Minuten, unverbindlich."
      locale="de"
      portrait={PORTRAIT}
      privacyHref="/privacy"
      title="Kostenloses Erstgespräch"
    />,
  );
}

describe("ContactSection", () => {
  it("renders exactly one contact form with both submit paths", () => {
    renderContactSection();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Kostenloses Erstgespräch",
      }),
    ).toBeTruthy();
    expect(document.querySelectorAll("form")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Weiter zur Terminauswahl" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Anfrage senden" })).toBeTruthy();
    expect(screen.getByText("Lieber schreiben statt sprechen?")).toBeTruthy();
  });

  it("renders the portrait card with its trust points", () => {
    renderContactSection();

    expect(screen.getByAltText("Porträt von Moritz Hecht")).toBeTruthy();
    expect(screen.getByText("Moritz Hecht")).toBeTruthy();
    expect(screen.getByText("Klarer nächster Schritt")).toBeTruthy();
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

  it("explains what the email path does before the visitor uses it", () => {
    renderContactSection();

    expect(screen.getByText("Lieber schreiben statt sprechen?")).toBeTruthy();
    expect(
      screen.getByText(
        "Das ausgefüllte Formular geht als E-Mail an mich. Ich antworte in der Regel innerhalb von 24 Stunden.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Anfrage senden" })).toBeTruthy();
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
