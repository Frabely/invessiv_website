// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ServicesSection } from "./services-section";

const serviceCards = [
  {
    key: "web" as const,
    iconSrc: "/services/coding-icon.svg",
    iconAlt: "Web Icon",
    title: "Webseiten",
    fit: "Relaunches mit mehreren Kernseiten.",
    highlight: "klarer professioneller Auftritt",
    pricingHint: "Individuelles Angebot nach Seitenumfang und Tiefe",
    delivery: "7-14 Tage",
    included: ["Konzept", "UI", "Setup", "Review", "Übergabe"],
    details: ["Zweiter Zusatzhinweis"],
  },
  {
    key: "landing" as const,
    iconSrc: "/services/website-layout-icon.svg",
    iconAlt: "Landing Icon",
    title: "Landingpages",
    fit: "Angebotsseiten mit klarem Conversion-Ziel.",
    highlight: "schnell live & conversion-fokussiert",
    pricingHint: "Angebot nach Ziel, Umfang und Feedbackbedarf",
    delivery: "3-7 Tage",
    included: ["Rahmen", "Mobil klar", "Kontaktweg"],
  },
  {
    key: "process" as const,
    iconSrc: "/services/process-icon.svg",
    iconAlt: "Process Icon",
    title: "Interne Tools",
    description: "Maßgeschneiderte Tools für interne Abläufe.",
    fit: "Teams mit klaren Routineabläufen.",
    highlight: "weniger manuelle Schritte im Alltag",
    pricingHint: "Kalkulation nach Workflow, Daten und Integrationen",
    delivery: "1-2 Wochen",
    included: ["Audit", "Konzept", "Setup", "Testing"],
  },
  {
    key: "upgrade" as const,
    iconSrc: "/services/upgrade-icon.svg",
    iconAlt: "Upgrade Icon",
    title: "Webseiten-Upgrade",
    fit: "Für Seiten mit Potenzial.",
    highlight: "spürbare UX- und Speed-Verbesserung",
    pricingHint: "Angebot nach Ist-Zustand und Eingriffstiefe",
    delivery: "2-5 Tage",
    included: ["Analyse", "UX", "Optimierung", "Review"],
    details: ["Zusatzhinweis"],
  },
  {
    key: "maintenance" as const,
    iconSrc: "/services/customer-service-icon.svg",
    iconAlt: "Support Icon",
    title: "Wartung & Support",
    description: "Pflege und Support.",
    fit: "Für laufende Anpassungen.",
    highlight: "schnelle Hilfe für laufende Themen",
    pricingHint: "Nach Aufwand oder abgestimmtem Betreuungspaket",
    delivery: "24-72h",
    included: ["Bugfixes", "Anpassungen", "Checks"],
  },
];

const serviceOptions = [
  {
    key: "more_inquiries",
    label: "Mehr passende Anfragen",
    serviceKey: "landing",
  },
  {
    key: "simplify_processes",
    label: "Interne Abläufe vereinfachen",
    serviceKey: "process",
  },
  {
    key: "improve_existing_site",
    label: "Bestehende Seite klarer machen",
    serviceKey: "upgrade",
  },
  {
    key: "plan_new_website",
    label: "Neue Website starten",
    serviceKey: "web",
  },
];

function renderSection() {
  return render(
    <ServicesSection
      addonBadgeLabel="Zusatzleistung"
      deliveryLabel="Zeitrahmen"
      detailPageCtaLabel="Ablauf & Kosten ansehen"
      id="services"
      kicker="LEISTUNGEN"
      launchAddonTitle="Ergänzend nach dem Launch"
      otherServicesTitle="Andere mögliche Leistungen"
      primaryCtaLabel="Projekt anfragen"
      primaryCtaLabels={{
        landing: "Projekt anfragen",
        maintenance: "Wartung & Support anfragen",
        process: "Projekt anfragen",
        upgrade: "Upgrade anfragen",
        web: "Projekt anfragen",
      }}
      recommendedBadgeLabel="Empfohlen für dich"
      sectionRef={{ current: null }}
      serviceCards={serviceCards}
      serviceContextNote="Vor Start erhältst du ein klares Angebot mit Umfang, Zeitrahmen und Kosten."
      serviceDetailHrefs={{
        landing: "/de/services/landing-page",
      }}
      serviceOptions={serviceOptions}
      servicePickerTitle="Wähle die Leistung, die gerade am besten zu deinem nächsten Schritt passt."
      serviceSecondaryTitle="Ergänzend nach dem Launch"
      title="Was brauchst du gerade?"
    />,
  );
}

describe("ServicesSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders service chips in the requested order and shows landing as the default active service", () => {
    const { container } = renderSection();

    expect(screen.getByText("LEISTUNGEN")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Was brauchst du gerade?",
      }),
    ).toBeTruthy();
    expect(
      within(screen.getByRole("group"))
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual([
      "Mehr passende Anfragen",
      "Interne Abläufe vereinfachen",
      "Bestehende Seite klarer machen",
      "Neue Website starten",
    ]);

    const activeService = container.querySelector(
      "[data-service-variant='active']",
    );
    const alternatives = Array.from(
      container.querySelectorAll("[data-service-variant='alternative']"),
    );

    expect(activeService?.getAttribute("data-card-key")).toBe("landing");
    expect(
      within(activeService as HTMLElement).getByText("Empfohlen für dich"),
    ).toBeTruthy();
    expect(
      within(activeService as HTMLElement)
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("landing");
    expect(
      within(activeService as HTMLElement)
        .getByRole("link", { name: "Ablauf & Kosten ansehen" })
        .getAttribute("href"),
    ).toBe("/de/services/landing-page");
    expect(
      alternatives.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["process", "upgrade", "web"]);
  });

  it("selects process as a primary service and removes it from the alternative list", () => {
    const { container } = renderSection();

    fireEvent.click(
      screen.getByRole("button", { name: "Interne Abläufe vereinfachen" }),
    );

    const activeService = container.querySelector(
      "[data-service-variant='active']",
    ) as HTMLElement;
    const alternatives = Array.from(
      container.querySelectorAll("[data-service-variant='alternative']"),
    );

    expect(activeService.getAttribute("data-card-key")).toBe("process");
    expect(within(activeService).getByText("Interne Tools")).toBeTruthy();
    expect(
      within(activeService).queryByText("Empfohlen für dich"),
    ).toBeTruthy();
    expect(
      within(activeService)
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("process");
    expect(
      within(activeService)
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-goal"),
    ).toBe("Interne Abläufe vereinfachen");
    expect(
      alternatives.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["landing", "upgrade", "web"]);
  });

  it("keeps the alternative list stably sorted for every selected primary service", () => {
    const { container } = renderSection();

    fireEvent.click(
      screen.getByRole("button", { name: "Bestehende Seite klarer machen" }),
    );
    expect(
      Array.from(
        container.querySelectorAll("[data-service-variant='alternative']"),
      ).map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["landing", "process", "web"]);

    fireEvent.click(
      screen.getByRole("button", { name: "Neue Website starten" }),
    );
    expect(
      Array.from(
        container.querySelectorAll("[data-service-variant='alternative']"),
      ).map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["landing", "process", "upgrade"]);
  });

  it("keeps maintenance separate from the primary service picker", () => {
    const { container } = renderSection();

    expect(
      within(screen.getByRole("group"))
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).not.toContain("Wartung & Support");
    expect(
      Array.from(
        container.querySelectorAll("[data-service-variant='alternative']"),
      ).map((card) => card.getAttribute("data-card-key")),
    ).not.toContain("maintenance");
    expect(
      container
        .querySelector("[data-service-variant='secondary']")
        ?.getAttribute("data-card-key"),
    ).toBe("maintenance");
    expect(screen.getByText("Ergänzend nach dem Launch")).toBeTruthy();
  });
});
