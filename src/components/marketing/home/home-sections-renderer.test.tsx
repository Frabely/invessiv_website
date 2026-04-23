// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeSectionsRenderer } from "./home-sections-renderer";
import { getHomeUiContent } from "@/i18n/dictionaries/marketing/home-ui";
import type { HomeSectionContent } from "@/i18n/dictionaries/marketing/home";

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

const sections: HomeSectionContent[] = [
  {
    id: "lead-bridge",
    title: "Bridge",
    description: "Einstieg",
  },
  {
    id: "services",
    title: "Services",
    description: "Leistungen",
    serviceSecondaryTitle: "Schon etwas da?",
    serviceCards: [
      {
        key: "web",
        title: "Webseiten",
        description: "Produktive Webseiten",
        highlight: "klarer professioneller Auftritt",
        pricingHint: "Individuelles Angebot nach Seitenumfang und Tiefe",
        delivery: "2-4 Wochen",
        included: ["Konzept"],
      },
      {
        key: "landing",
        title: "Landingpages",
        description: "Fokussierte Kampagnenseiten",
        highlight: "schnell live & conversion-fokussiert",
        pricingHint: "Angebot nach Ziel, Umfang und Feedbackbedarf",
        delivery: "3-7 Tage",
        included: ["Konzept"],
      },
      {
        key: "process",
        title: "Prozess-Tools",
        description: "Interne Workflows",
        highlight: "weniger manuelle Schritte im Alltag",
        pricingHint: "Kalkulation nach Workflow, Daten und Integrationen",
        delivery: "1-2 Wochen",
        included: ["Konzept"],
      },
      {
        key: "upgrade",
        title: "Webseiten-Upgrade",
        description: "Bestehendes verbessern",
        highlight: "spürbare UX- und Speed-Verbesserung",
        pricingHint: "Angebot nach Ist-Zustand und Eingriffstiefe",
        delivery: "2-5 Tage",
        included: ["Analyse"],
      },
      {
        key: "maintenance",
        title: "Wartung & Support",
        description: "Pflege und Support",
        highlight: "schnelle Hilfe für laufende Themen",
        pricingHint: "Nach Aufwand oder abgestimmtem Betreuungspaket",
        delivery: "24-72h",
        included: ["Bugfixes"],
      },
    ],
  },
  {
    id: "proof",
    title: "Was Kunden über die Zusammenarbeit sagen",
    description: "aus realen Projekten",
    proofReviews: [
      {
        authorName: "Kolja Wienigk",
        context: "Finanzmakler aus Dresden",
        excerpt: "Klare Struktur.",
        reviewHref: "https://example.com",
        sourceLabel: "Google Bewertung",
      },
    ],
  },
  {
    id: "contact",
    title: "Kontakt",
    description: "Projektanfrage",
    contactChannels: [],
    contactCta: {
      href: "#contact",
      label: "Projekt anfragen",
      hint: "Antwort in 24h.",
    },
    contactForm: {
      title: "Projektanfrage",
      subtitle: "Kurzbriefing",
      intro: "Beschreibe dein Vorhaben.",
      conditionalFieldHint: "Dynamische Pflichtfelder",
      firstNameLabel: "Vorname",
      lastNameLabel: "Nachname",
      emailLabel: "E-Mail",
      addPageLabel: "Seite hinzufügen",
      phoneLabel: "Telefon",
      companyLabel: "Unternehmen",
      roleLabel: "Rolle",
      websiteLabel: "Webseite",
      offerLabel: "Angebot",
      offerPlaceholder: "Bitte wählen",
      goalLabel: "Ziel",
      goalOptions: [{ key: "generate_inquiries", label: "Anfragen" }],
      pagesLabel: "Seiten",
      pagesPlaceholder: "Start, Kontakt",
      pagesOptions: [{ key: "home", label: "Start" }],
      workflowLabel: "Workflows",
      workflowOptions: [
        {
          key: "digitize_existing_process",
          label: "Bestehenden Ablauf digitalisieren",
        },
      ],
      stepNavigationLabel: "Fortschritt",
      stepLabel: "Schritt",
      stepOneTitle: "Kontakt",
      stepTwoTitle: "Projekt",
      stepThreeTitle: "Rahmen",
      previousStepLabel: "Zurück",
      nextStepLabel: "Weiter",
      budgetLabel: "Budget",
      budgetOptions: [{ key: "open", label: "Offen" }],
      startLabel: "Start",
      startOptions: [{ key: "immediately", label: "Sofort" }],
      projectDetailsLabel: "Projekt",
      projectDetailsPlaceholder: "Details",
      consentLabel: "Ich stimme gemäß",
      privacyLabel: "Datenschutz",
      submitLabel: "Senden",
      submittingLabel: "Wird gesendet",
      submitSuccess: "Erfolg",
      submitErrorValidation: "Bitte prüfen",
      submitErrorRateLimited: "Zu viele Anfragen",
      submitErrorDelivery: "Zustellung nicht möglich",
      submitErrorGeneric: "Allgemeiner Fehler",
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
      requiredHint: "* Pflichtfelder",
    },
    quickContactForm: {
      title: "Kurze E-Mail",
      subtitle: "Schneller Kontakt",
      intro: "Kurz reicht.",
      metaLabel: "E-Mail",
      copyActionLabel: "E-Mail kopieren",
      copiedActionLabel: "E-Mail kopiert",
      firstNameLabel: "Vorname",
      lastNameLabel: "Nachname",
      emailLabel: "E-Mail",
      messageLabel: "Nachricht",
      messagePlaceholder: "Schreib kurz dein Anliegen.",
      consentLabel: "Ich stimme gemÃ¤ÃŸ",
      privacyLabel: "Datenschutz",
      submitLabel: "E-Mail senden",
      submittingLabel: "Wird gesendet",
      submitErrorRateLimited: "Zu viele Anfragen",
      submitErrorDelivery: "Zustellung nicht möglich",
      submitErrorGeneric: "Allgemeiner Fehler",
      submitSuccess: "Mail wird geÃ¶ffnet",
      fieldErrorInvalidEmail: "UngÃ¼ltige E-Mail",
      fieldErrorRequired: "Pflichtfeld",
      fieldErrorConsentRequired: "Zustimmung erforderlich",
      requiredHint: "* Pflichtfelder",
    },
  },
  {
    id: "footer",
    title: "Footer",
    description: "Footer",
    footerColumns: [],
    footerLegalLinks: [{ label: "Datenschutz", href: "/de/privacy" }],
  },
];

describe("HomeSectionsRenderer", () => {
  it("passes the five active services into the project request select", () => {
    render(
      <HomeSectionsRenderer
        sections={sections}
        servicesSectionRef={createRef<HTMLElement>()}
        showProofSection={true}
        ui={getHomeUiContent("de")}
        validation={{
          hasCompleteMapping: true,
          missingInNavigation: [],
          missingInSections: [],
        }}
      />,
    );

    const offerSelect = screen.getByRole("combobox", {
      name: "Angebot*",
    });

    expect(screen.getByRole("option", { name: "Webseiten" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Landingpages" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Prozess-Tools" })).toBeTruthy();
    expect(
      screen.getByRole("option", { name: "Webseiten-Upgrade" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("option", { name: "Wartung & Support" }),
    ).toBeTruthy();
    expect(offerSelect.textContent).not.toContain("KI-Templates & Agents");
  });

  it("renders the lead bridge before services and proof after services", () => {
    render(
      <HomeSectionsRenderer
        sections={sections}
        servicesSectionRef={createRef<HTMLElement>()}
        showProofSection={true}
        ui={getHomeUiContent("de")}
        validation={{
          hasCompleteMapping: true,
          missingInNavigation: [],
          missingInSections: [],
        }}
      />,
    );

    const bridgeHeading = screen.getByRole("heading", {
      name: "Klarer Einstieg. Saubere Umsetzung. Ein nächster Schritt, der passt.",
    });
    const servicesHeading = screen.getByRole("heading", {
      name: "Services",
    });
    const proofHeading = screen.getByRole("heading", {
      name: "Was Kunden über die Zusammenarbeit sagen",
    });

    expect(
      bridgeHeading.compareDocumentPosition(servicesHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      servicesHeading.compareDocumentPosition(proofHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("does not render the proof section while the launch flag is disabled", () => {
    render(
      <HomeSectionsRenderer
        sections={sections}
        servicesSectionRef={createRef<HTMLElement>()}
        showProofSection={false}
        ui={getHomeUiContent("de")}
        validation={{
          hasCompleteMapping: true,
          missingInNavigation: [],
          missingInSections: [],
        }}
      />,
    );

    expect(
      screen.queryByRole("heading", {
        name: "Was Kunden über die Zusammenarbeit sagen",
      }),
    ).not.toBeInTheDocument();
  });
});
