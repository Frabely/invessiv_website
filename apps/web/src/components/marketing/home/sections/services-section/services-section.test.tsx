// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServicesSection } from "./services-section";

const serviceCards = [
  {
    key: "web" as const,
    iconSrc: "/services/coding-icon.svg",
    iconAlt: "Web Icon",
    title: "Business Website",
    description: "Eine umfangreiche Website für mehrere Leistungen.",
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
    title: "Landingpage",
    description: "Eine fokussierte Seite für ein klares Ziel.",
    fit: "Angebotsseiten mit klarem Conversion-Ziel.",
    highlight: "schnell live & conversion-fokussiert",
    pricingHint: "Angebot nach Ziel, Umfang und Feedbackbedarf",
    delivery: "3-7 Tage",
    included: ["Rahmen", "Mobil klar", "Kontaktweg"],
    details: [
      "Landingpages sind der schnellste Einstieg.",
      "Website und Relaunch bleiben möglich.",
    ],
  },
  {
    key: "upgrade" as const,
    iconSrc: "/services/upgrade-icon.svg",
    iconAlt: "Upgrade Icon",
    title: "Kompakte Website",
    description: "Eine übersichtliche Webpräsenz mit zentralen Inhalten.",
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
    delivery: "ca. 24h",
    deliveryLabel: "Antwortzeit",
    included: ["Bugfixes", "Anpassungen", "Checks"],
  },
];

const serviceOptions = [
  {
    key: "landing_page",
    label: "Ein Angebot gezielt verkaufen",
    serviceKey: "landing",
  },
  {
    key: "compact_website",
    label: "Professionell online auftreten",
    serviceKey: "upgrade",
  },
  {
    key: "business_website",
    label: "Ein umfangreiches Webprojekt umsetzen",
    serviceKey: "web",
  },
];

const servicePickerName =
  "Wähle das Vorhaben, das deinen Plänen am nächsten kommt.";

function renderSection() {
  return render(
    <ServicesSection
      deliveryLabel="Zeitrahmen"
      detailPageCtaLabel="Ablauf & Kosten ansehen"
      id="services"
      kicker="LEISTUNGEN"
      primaryCtaLabel="Kostenloses Erstgespräch anfragen"
      primaryCtaLabels={{
        landing: "Kostenloses Erstgespräch anfragen",
        maintenance: "Kostenloses Erstgespräch anfragen",
        process: "Kostenloses Erstgespräch anfragen",
        upgrade: "Kostenloses Erstgespräch anfragen",
        web: "Kostenloses Erstgespräch anfragen",
      }}
      recommendedBadgeLabel="Empfohlen für dich"
      sectionRef={{ current: null }}
      serviceCards={serviceCards}
      serviceDetailHrefs={{
        landing: "/de/services/landing-page",
      }}
      serviceOptions={serviceOptions}
      servicePickerTitle="Wähle das Vorhaben, das deinen Plänen am nächsten kommt."
      title="Was hast du mit deiner Website vor?"
    />,
  );
}

describe("ServicesSection", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders service chips in the requested order and shows landing as the default active service", () => {
    const { container } = renderSection();

    expect(screen.getByText("LEISTUNGEN")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Was hast du mit deiner Website vor?",
      }),
    ).toBeTruthy();
    expect(
      within(screen.getByRole("group", { name: servicePickerName }))
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual([
      "Ein Angebot gezielt verkaufen",
      "Professionell online auftreten",
      "Ein umfangreiches Webprojekt umsetzen",
    ]);

    const activeService = container.querySelector(
      "[data-service-variant='active']",
    );

    expect(activeService?.getAttribute("data-card-key")).toBe("landing");
    expect(
      within(activeService as HTMLElement).getByText("Empfohlen für dich"),
    ).toBeTruthy();
    expect(
      within(activeService as HTMLElement)
        .getByRole("link", { name: "Kostenloses Erstgespräch anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("landing");
    expect(
      within(activeService as HTMLElement)
        .getByRole("link", { name: "Ablauf & Kosten ansehen" })
        .getAttribute("href"),
    ).toBe("/de/services/landing-page");
    expect(
      within(activeService as HTMLElement).queryByText("Mehr Infos"),
    ).toBeNull();
    expect(within(activeService as HTMLElement).queryByText(/→/)).toBeNull();
    expect(screen.queryByText("Weitere Webdesign-Pakete")).toBeNull();
    expect(
      container.querySelector("[data-service-variant='alternative']"),
    ).toBeNull();
  });

  it("selects the compact website from the package picker", () => {
    const { container } = renderSection();

    fireEvent.click(
      screen.getByRole("button", { name: "Professionell online auftreten" }),
    );

    const activeService = container.querySelector(
      "[data-service-variant='active']",
    ) as HTMLElement;
    expect(activeService.getAttribute("data-card-key")).toBe("upgrade");
    expect(within(activeService).getByText("Kompakte Website")).toBeTruthy();
    expect(
      within(activeService).queryByText("Empfohlen für dich"),
    ).toBeTruthy();
    expect(
      within(activeService)
        .getByRole("link", { name: "Kostenloses Erstgespräch anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("upgrade");
    expect(
      within(activeService)
        .getByRole("link", { name: "Kostenloses Erstgespräch anfragen" })
        .getAttribute("data-project-goal"),
    ).toBe("Professionell online auftreten");
    expect(within(activeService).queryByText("Mehr Infos")).toBeNull();
  });

  it("renders all three web design packages in the picker", () => {
    const { container } = renderSection();

    expect(
      within(screen.getByRole("group", { name: servicePickerName }))
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual([
      "Ein Angebot gezielt verkaufen",
      "Professionell online auftreten",
      "Ein umfangreiches Webprojekt umsetzen",
    ]);
    expect(container.querySelector("[data-card-key='process']")).toBeNull();
  });

  it("keeps the picker hint accessible only", () => {
    renderSection();

    expect(screen.queryByText(servicePickerName)).toBeNull();
    expect(screen.getByRole("group", { name: servicePickerName })).toBeTruthy();
  });

  it("does not render the maintenance service", () => {
    const { container } = renderSection();

    expect(
      within(screen.getByRole("group", { name: servicePickerName }))
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).not.toContain("Wartung & Support");
    expect(container.querySelector("[data-card-key='maintenance']")).toBeNull();
    expect(screen.queryByText("Wartung & Support")).toBeNull();
  });
});
