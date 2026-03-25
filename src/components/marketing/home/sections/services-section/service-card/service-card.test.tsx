// @vitest-environment jsdom

import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServiceCard } from "./service-card";

describe("ServiceCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the fit text under the title and keeps the primary CTA inside the card", () => {
    function ServiceCardHarness() {
      const [isDetailsOpen, setIsDetailsOpen] = useState(false);

      return (
        <ServiceCard
          card={{
            key: "landing",
            title: "Landingpages",
            description: "Conversion-optimierte One-Pager.",
            fit: "Angebotsseiten mit klarer Conversion-Aktion.",
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
          cardClassName="card-shell"
          ctaLabel="Landingpage anfragen"
          ctaProjectGoal="mehr Anfragen gewinnen"
          defaultDeliveryLabel="Lieferzeit"
          detailsCtaLabel="Mehr Infos"
          fitLabel="Ideal für"
          isCtaActive
          isDetailsOpen={isDetailsOpen}
          isRecommended
          moreItemsPluralLabel="weitere Punkte"
          moreItemsSingularLabel="weiterer Punkt"
          onCardSelectAction={vi.fn()}
          onDetailsToggleAction={setIsDetailsOpen}
          onPointerLeave={vi.fn()}
          onPointerMove={vi.fn()}
          oneTimeLabel="einmalig"
          recommendedBadgeLabel="Empfohlen"
        />
      );
    }

    const { container } = render(<ServiceCardHarness />);

    expect(screen.getByText("Ideal für")).toBeTruthy();
    expect(
      screen.getByText("Angebotsseiten mit klarer Conversion-Aktion."),
    ).toBeTruthy();
    expect(screen.queryByText("Conversion-optimierte One-Pager.")).toBeNull();
    expect(screen.getByText("+ 4 weitere Punkte")).toBeTruthy();

    const article = container.querySelector("article");
    const detailsButton = screen.getByRole("button", { name: /Mehr Infos/i });
    const detailsPanelId = detailsButton.getAttribute("aria-controls");
    const detailsPanel = detailsPanelId
      ? document.getElementById(detailsPanelId)
      : null;

    fireEvent.click(article as HTMLElement);

    expect(detailsButton.getAttribute("aria-expanded")).toBe("true");
    expect(detailsPanel?.hasAttribute("hidden")).toBe(false);
    expect(
      screen.getByRole("link", { name: "Landingpage anfragen" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Landingpage anfragen" })
        .getAttribute("data-project-goal"),
    ).toBe("mehr Anfragen gewinnen");

    fireEvent.keyDown(article as HTMLElement, { key: "Escape" });

    expect(detailsButton.getAttribute("aria-expanded")).toBe("false");
    expect(detailsPanel?.hasAttribute("hidden")).toBe(true);
  });

  it("uses the singular more-items label when exactly one item is hidden", () => {
    render(
      <ServiceCard
        card={{
          key: "process",
          title: "Prozess-Tools",
          description: "Kurzbeschreibung.",
          iconSrc: "/services/process-icon.svg",
          iconAlt: "Process icon",
          price: "ab 1490 EUR einmalig",
          delivery: "1-2 Wochen",
          included: ["Punkt 1", "Punkt 2", "Punkt 3", "Punkt 4"],
        }}
        ctaProjectGoal=""
        ctaLabel="Request process tool"
        defaultDeliveryLabel="Lieferzeit"
        detailsCtaLabel="Mehr Infos"
        fitLabel="Best for"
        isDetailsOpen={false}
        moreItemsPluralLabel="more items"
        moreItemsSingularLabel="more item"
        onCardSelectAction={vi.fn()}
        onDetailsToggleAction={vi.fn()}
        onPointerLeave={vi.fn()}
        onPointerMove={vi.fn()}
        oneTimeLabel="one-time"
        recommendedBadgeLabel="Recommended"
      />,
    );

    expect(screen.getByText("+ 1 more item")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
