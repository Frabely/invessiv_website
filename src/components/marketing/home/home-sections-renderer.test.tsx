// @vitest-environment jsdom

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

const sections: HomeSectionContent[] = [
  {
    id: "services",
    title: "Services",
    description: "Leistungen",
    serviceCards: [
      {
        key: "ai",
        title: "KI-Templates & Agents",
        description: "Temporär nicht im Anfrageformular.",
        isComingSoon: true,
      },
      {
        key: "web",
        title: "Webseiten",
        description: "Produktive Websites",
        price: "ab 3.000 €",
        delivery: "2-4 Wochen",
        included: ["Konzept"],
      },
    ],
  },
  {
    id: "contact",
    title: "Kontakt",
    description: "Projektanfrage",
    contactChecklist: ["Ziel"],
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
      firstNameLabel: "Name",
      emailLabel: "E-Mail",
      phoneLabel: "Telefon",
      companyLabel: "Unternehmen",
      roleLabel: "Rolle",
      websiteLabel: "Website",
      websiteRequiredHint: "Website erforderlich",
      offerLabel: "Angebot",
      offerPlaceholder: "Bitte wählen",
      goalLabel: "Ziel",
      goalOptions: [{ key: "generate_inquiries", label: "Anfragen" }],
      pagesLabel: "Seiten",
      pagesPlaceholder: "Start, Kontakt",
      pagesOptions: [{ key: "home", label: "Start" }],
      workflowLabel: "Workflows",
      workflowOptions: [{ key: "one_workflow", label: "1 Workflow" }],
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
      fieldErrorInvalidWebsite: "Ungültige Website",
      fieldErrorRequired: "Pflichtfeld",
      fieldErrorProjectDetailsRequired: "Projekt erforderlich",
      fieldErrorPagesRequired: "Seiten erforderlich",
      fieldErrorGoalRequired: "Ziel erforderlich",
      fieldErrorWorkflowRequired: "Workflow erforderlich",
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
  it("omits the AI offer from the project request select", () => {
    render(
      <HomeSectionsRenderer
        sections={sections}
        servicesSectionRef={createRef<HTMLElement>()}
        ui={getHomeUiContent("de")}
        validation={{ hasCompleteMapping: true, missingMappings: [] }}
      />,
    );

    const offerSelect = screen.getByRole("combobox", {
      name: "Angebot*",
    });

    expect(screen.getByRole("option", { name: "Webseiten" })).toBeTruthy();
    expect(
      screen.queryByRole("option", { name: "KI-Templates & Agents" }),
    ).toBeNull();
    expect(offerSelect.textContent).not.toContain("KI-Templates & Agents");
  });
});
