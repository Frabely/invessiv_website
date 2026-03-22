// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ServicesSection } from "./services-section";

const serviceCards = [
  {
    key: "web" as const,
    iconSrc: "/services/coding-icon.svg",
    iconAlt: "Web Icon",
    title: "Webseiten",
    description: "Webseiten Paket.",
    fit: "Relaunches mit mehreren Kernseiten.",
    price: "ab 2490 EUR einmalig",
    delivery: "7-14 Tage",
    included: ["Konzept", "UI", "Setup", "Review", "Übergabe"],
    details: ["Zweiter Zusatzhinweis"],
  },
  {
    key: "landing" as const,
    iconSrc: "/services/website-layout-icon.svg",
    iconAlt: "Landing Icon",
    title: "Landingpages",
    description: "Landingpage Paket.",
    fit: "Angebotsseiten mit klarem Conversion-Ziel.",
    isRecommended: true,
    price: "ab 990 EUR einmalig",
    delivery: "3-7 Tage",
    included: ["Rahmen", "Design", "SEO", "Performance", "Tracking"],
    details: ["Zusatzhinweis"],
  },
  {
    key: "process" as const,
    iconSrc: "/services/process-icon.svg",
    iconAlt: "Process Icon",
    title: "Prozess-Tools",
    description: "Workflows digitalisieren.",
    fit: "Teams mit klaren Routineabläufen.",
    price: "ab 1490 EUR einmalig",
    delivery: "1-2 Wochen",
    included: ["Audit", "Konzept", "Setup", "Testing"],
  },
  {
    key: "upgrade" as const,
    iconSrc: "/services/upgrade-icon.svg",
    iconAlt: "Upgrade Icon",
    title: "Website-Upgrade",
    description: "Bestehendes verbessern.",
    fit: "Für Seiten mit Potenzial.",
    price: "ab 690 EUR einmalig",
    delivery: "2-5 Tage",
    included: ["Analyse", "UX", "Optimierung"],
  },
  {
    key: "maintenance" as const,
    iconSrc: "/services/customer-service-icon.svg",
    iconAlt: "Support Icon",
    title: "Wartung & Support",
    description: "Pflege und Support.",
    fit: "Für laufende Anpassungen.",
    price: "50 EUR / h",
    delivery: "24-72h",
    included: ["Bugfixes", "Anpassungen", "Checks"],
  },
];

describe("ServicesSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders three primary cards, two secondary cards, and a shared CTA defaulting to landing", () => {
    const { container } = render(
      <ServicesSection
        addonBadgeLabel="Add-on"
        deliveryLabel="Lieferzeit"
        detailsCtaLabel="Mehr Infos"
        description="Leistungen als Richtwerte."
        fitLabel="Ideal für"
        id="services"
        moreItemsPluralLabel="weitere Punkte"
        moreItemsSingularLabel="weiterer Punkt"
        oneTimeLabel="einmalig"
        primaryCtaLabel="Projekt anfragen"
        recommendedBadgeLabel="Empfohlen"
        sectionRef={{ current: null }}
        serviceCards={serviceCards}
        serviceSecondaryTitle="Schon etwas da?"
        summaryPoints={["Umfang vor Start", "Klare Lieferfenster"]}
        title="Was brauchst du gerade?"
      />,
    );

    const primaryCards = Array.from(
      container.querySelectorAll("[data-service-variant='primary']"),
    );
    const secondaryCards = Array.from(
      container.querySelectorAll("[data-service-variant='secondary']"),
    );

    expect(primaryCards).toHaveLength(3);
    expect(secondaryCards).toHaveLength(2);
    expect(
      primaryCards.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["web", "landing", "process"]);
    expect(
      secondaryCards.map((card) => card.getAttribute("data-card-key")),
    ).toEqual(["upgrade", "maintenance"]);
    expect(screen.getByText("Empfohlen")).toBeTruthy();
    expect(screen.queryByText("KI-Templates & Agents")).toBeNull();
    expect(screen.queryByText(/Ausgewählt:/i)).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("landing");
  });

  it("keeps only one primary card expanded at a time", () => {
    render(
      <ServicesSection
        addonBadgeLabel="Add-on"
        deliveryLabel="Lieferzeit"
        detailsCtaLabel="Mehr Infos"
        description="Leistungen als Richtwerte."
        fitLabel="Ideal für"
        id="services"
        moreItemsPluralLabel="weitere Punkte"
        moreItemsSingularLabel="weiterer Punkt"
        oneTimeLabel="einmalig"
        primaryCtaLabel="Projekt anfragen"
        recommendedBadgeLabel="Empfohlen"
        sectionRef={{ current: null }}
        serviceCards={serviceCards}
        serviceSecondaryTitle="Schon etwas da?"
        summaryPoints={["Umfang vor Start", "Klare Lieferfenster"]}
        title="Was brauchst du gerade?"
      />,
    );

    const landingArticle = screen.getByText("Landingpages").closest("article");
    const webArticle = screen.getByText("Webseiten").closest("article");
    const landingDetails = document.getElementById("services-details-landing");
    const webDetails = document.getElementById("services-details-web");

    expect(landingDetails?.hasAttribute("hidden")).toBe(true);
    expect(webDetails?.hasAttribute("hidden")).toBe(true);

    fireEvent.click(landingArticle as HTMLElement);
    expect(landingDetails?.hasAttribute("hidden")).toBe(false);
    expect(webDetails?.hasAttribute("hidden")).toBe(true);

    fireEvent.click(webArticle as HTMLElement);
    expect(landingDetails?.hasAttribute("hidden")).toBe(true);
    expect(webDetails?.hasAttribute("hidden")).toBe(false);
  });

  it("updates the shared CTA offer when a secondary card is selected", () => {
    render(
      <ServicesSection
        addonBadgeLabel="Add-on"
        deliveryLabel="Lieferzeit"
        detailsCtaLabel="Mehr Infos"
        description="Leistungen als Richtwerte."
        fitLabel="Ideal für"
        id="services"
        moreItemsPluralLabel="weitere Punkte"
        moreItemsSingularLabel="weiterer Punkt"
        oneTimeLabel="einmalig"
        primaryCtaLabel="Projekt anfragen"
        recommendedBadgeLabel="Empfohlen"
        sectionRef={{ current: null }}
        serviceCards={serviceCards}
        serviceSecondaryTitle="Schon etwas da?"
        summaryPoints={["Umfang vor Start", "Klare Lieferfenster"]}
        title="Was brauchst du gerade?"
      />,
    );

    fireEvent.click(
      screen.getByText("Website-Upgrade").closest("article") as HTMLElement,
    );

    expect(screen.queryByText(/Ausgewählt:/i)).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("upgrade");
  });
});
