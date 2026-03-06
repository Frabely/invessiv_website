// @vitest-environment jsdom

import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServiceCard } from "./service-card";

describe("ServiceCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a price-first hierarchy and reveals hidden scope details", () => {
    function ServiceCardHarness() {
      const [isDetailsOpen, setIsDetailsOpen] = useState(false);

      return (
        <ServiceCard
          addonBadgeLabel="Add-on"
          card={{
            key: "landing",
            isRecommended: true,
            title: "Landingpages",
            description: "Conversion-optimierte One-Pager.",
            iconSrc: "/services/01_landingpages.png",
            iconAlt: "Landingpages Icon",
            price: "ab 990 EUR einmalig",
            delivery: "3-7 Tage",
            included: [
              "Struktur & Wireframe",
              "Responsive Design",
              "Basis-SEO",
              "Performance-Optimierung",
              "Tracking-Setup",
            ],
            details: [
              "Mehr als 2 Korrekturschleifen werden separat kalkuliert.",
              "Hosting, Domain und externe Tool-Lizenzen sind nicht enthalten.",
            ],
          }}
          cardClassName="services-card"
          defaultDeliveryLabel="Lieferzeit"
          detailsCtaLabel="Mehr Infos"
          faqLinkLabel="Fragen?"
          isDetailsOpen={isDetailsOpen}
          moreItemsPluralLabel="weitere Punkte"
          moreItemsSingularLabel="weiterer Punkt"
          onDetailsToggle={setIsDetailsOpen}
          onPointerLeave={vi.fn()}
          onPointerMove={vi.fn()}
          oneTimeLabel="einmalig"
          primaryCtaLabel="Projekt anfragen"
          recommendedBadgeLabel="Empfohlen"
        />
      );
    }

    const { container } = render(<ServiceCardHarness />);

    expect(screen.getByText(/ab 990/i)).toBeTruthy();
    expect(screen.getByText("einmalig")).toBeTruthy();
    expect(screen.getByText(/Lieferzeit:\s*3-7 Tage/i)).toBeTruthy();
    expect(screen.getByText("+ 4 weitere Punkte")).toBeTruthy();
    expect(screen.getByText("Empfohlen")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Projekt anfragen" })).toBeNull();

    const detailsButton = screen.getByRole("button", { name: /Mehr Infos/i });
    const detailsPanelId = detailsButton.getAttribute("aria-controls");
    const detailsPanel = detailsPanelId
      ? document.getElementById(detailsPanelId)
      : null;
    const article = container.querySelector("article[role='listitem']");

    expect(article).toBeTruthy();

    expect(detailsButton.getAttribute("aria-expanded")).toBe("false");
    expect(detailsPanel?.hasAttribute("hidden")).toBe(true);

    fireEvent.click(article as HTMLElement);

    expect(detailsButton.getAttribute("aria-expanded")).toBe("true");
    expect(detailsPanel?.hasAttribute("hidden")).toBe(false);

    fireEvent.click(article as HTMLElement);

    expect(detailsButton.getAttribute("aria-expanded")).toBe("false");
    expect(detailsPanel?.hasAttribute("hidden")).toBe(true);

    fireEvent.click(detailsButton);

    expect(detailsButton.getAttribute("aria-expanded")).toBe("true");
    expect(detailsPanel?.hasAttribute("hidden")).toBe(false);

    fireEvent.click(detailsButton);

    expect(detailsButton.getAttribute("aria-expanded")).toBe("false");
    expect(detailsPanel?.hasAttribute("hidden")).toBe(true);

    fireEvent.click(detailsButton);

    expect(detailsButton.getAttribute("aria-expanded")).toBe("true");
    expect(detailsPanel?.hasAttribute("hidden")).toBe(false);
    expect(
      screen
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("href"),
    ).toBe("#contact");
    expect(
      screen
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("landing");
    expect(
      screen.getByRole("link", { name: "Fragen?" }).getAttribute("href"),
    ).toBe("#faq");
    expect(screen.getByText("Performance-Optimierung")).toBeTruthy();

    fireEvent.keyDown(article as HTMLElement, { key: "Escape" });

    expect(detailsButton.getAttribute("aria-expanded")).toBe("false");
    expect(detailsPanel?.hasAttribute("hidden")).toBe(true);
  });

  it("marks the maintenance card as add-on", () => {
    render(
      <ServiceCard
        addonBadgeLabel="Add-on"
        card={{
          key: "maintenance",
          title: "Wartung & Support",
          description: "Schnelle Änderungen und Bugfixes.",
          iconSrc: "/services/06_support.png",
          iconAlt: "Support Icon",
          price: "50 EUR / h",
          delivery: "24-72h",
          deliveryLabel: "Reaktionszeit",
          included: ["Kleine Änderungen", "Bugfixes", "Monitoring"],
          details: ["Stundenpakete: 5h = 225 EUR, 10h = 430 EUR."],
        }}
        cardClassName="services-card"
        defaultDeliveryLabel="Lieferzeit"
        detailsCtaLabel="Mehr Infos"
        faqLinkLabel="Fragen?"
        isDetailsOpen={false}
        moreItemsPluralLabel="weitere Punkte"
        moreItemsSingularLabel="weiterer Punkt"
        onDetailsToggle={vi.fn()}
        onPointerLeave={vi.fn()}
        onPointerMove={vi.fn()}
        oneTimeLabel="einmalig"
        primaryCtaLabel="Projekt anfragen"
        recommendedBadgeLabel="Empfohlen"
      />,
    );

    expect(screen.getByText("Add-on")).toBeTruthy();
    expect(screen.getByText(/50 EUR \/ h/i)).toBeTruthy();
    expect(screen.queryByText("einmalig")).toBeNull();
    expect(screen.getByText(/Reaktionszeit:\s*24-72h/i)).toBeTruthy();
  });

  it("uses singular more-items label when exactly one bullet is hidden", () => {
    render(
      <ServiceCard
        addonBadgeLabel="Add-on"
        card={{
          key: "landing",
          title: "Landingpages",
          description: "Kurzbeschreibung.",
          iconSrc: "/services/website-layout-icon.svg",
          iconAlt: "Landing icon",
          price: "ab 990 EUR einmalig",
          delivery: "3-7 Tage",
          included: ["Punkt 1", "Punkt 2", "Punkt 3", "Punkt 4"],
        }}
        cardClassName="services-card"
        defaultDeliveryLabel="Lieferzeit"
        detailsCtaLabel="Mehr Infos"
        faqLinkLabel="Fragen?"
        isDetailsOpen={false}
        moreItemsPluralLabel="more items"
        moreItemsSingularLabel="more item"
        onDetailsToggle={vi.fn()}
        onPointerLeave={vi.fn()}
        onPointerMove={vi.fn()}
        oneTimeLabel="one-time"
        primaryCtaLabel="Request project"
        recommendedBadgeLabel="Recommended"
      />,
    );

    expect(screen.getByText("+ 1 more item")).toBeTruthy();
  });
});
