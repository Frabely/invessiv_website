// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ServicesSection } from "./services-section";

describe("ServicesSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps only one service card expanded at a time", () => {
    render(
      <ServicesSection
        addonBadgeLabel="Add-on"
        comingSoonExamplesCtaLabel="Show examples"
        comingSoonExamplesHideLabel="Hide examples"
        comingSoonLabel="Coming soon"
        deliveryLabel="Lieferzeit"
        detailsCtaLabel="Mehr Infos"
        description="Leistungen als Richtwerte."
        faqLinkLabel="Fragen?"
        fitLabel="Ideal für"
        id="services"
        moreItemsPluralLabel="weitere Punkte"
        moreItemsSingularLabel="weiterer Punkt"
        oneTimeLabel="einmalig"
        primaryCtaLabel="Projekt anfragen"
        recommendedBadgeLabel="Empfohlen"
        sectionRef={{ current: null }}
        serviceCards={[
          {
            key: "landing",
            iconSrc: "/services/website-layout-icon.svg",
            iconAlt: "Landing Icon",
            title: "Landingpages",
            description: "Landingpage Paket.",
            fit: "Angebotsseiten mit klarem Conversion-Ziel.",
            price: "ab 990 EUR einmalig",
            delivery: "3-7 Tage",
            included: ["Rahmen", "Design", "SEO", "Performance", "Tracking"],
            details: ["Zusatzhinweis"],
          },
          {
            key: "web",
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
        ]}
        summaryPoints={["Umfang vor Start", "Klare Lieferfenster"]}
        title="Leistungen & Preise"
      />,
    );

    const landingArticle = screen.getByText("Landingpages").closest("article");
    const webArticle = screen.getByText("Webseiten").closest("article");

    const landingDetails = document.getElementById("services-details-landing");
    const webDetails = document.getElementById("services-details-web");

    expect(landingArticle).toBeTruthy();
    expect(webArticle).toBeTruthy();
    expect(landingDetails?.hasAttribute("hidden")).toBe(true);
    expect(webDetails?.hasAttribute("hidden")).toBe(true);

    fireEvent.click(landingArticle as HTMLElement);

    expect(landingDetails?.hasAttribute("hidden")).toBe(false);
    expect(webDetails?.hasAttribute("hidden")).toBe(true);

    fireEvent.click(webArticle as HTMLElement);

    expect(landingDetails?.hasAttribute("hidden")).toBe(true);
    expect(webDetails?.hasAttribute("hidden")).toBe(false);

    fireEvent.click(webArticle as HTMLElement);

    expect(landingDetails?.hasAttribute("hidden")).toBe(true);
    expect(webDetails?.hasAttribute("hidden")).toBe(true);
  });
});
