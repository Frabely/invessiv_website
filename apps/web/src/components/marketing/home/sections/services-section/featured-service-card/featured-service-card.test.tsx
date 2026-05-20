// @vitest-environment jsdom

import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeaturedServiceCard } from "./featured-service-card";

describe("FeaturedServiceCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows four initial bullets and gates the primary CTA by recommendation or expansion", () => {
    function FeaturedServiceCardHarness({
      isRecommended = true,
    }: {
      isRecommended?: boolean;
    }) {
      const [isDetailsOpen, setIsDetailsOpen] = useState(false);

      return (
        <FeaturedServiceCard
          card={{
            key: "landing",
            title: "Landingpages",
            fit: "Angebotsseiten mit klarer Conversion-Aktion.",
            iconSrc: "/services/01_landingpages.png",
            iconAlt: "Landingpages Icon",
            highlight: "Schnell live & conversion-fokussiert",
            pricingHint: "Angebot nach Ziel, Umfang und Feedbackbedarf",
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
          ctaLabel="Landingpage anfragen"
          ctaProjectGoal="mehr Anfragen gewinnen"
          defaultDeliveryLabel="Lieferzeit"
          detailsCtaLabel="Mehr Infos"
          fitLabel="Ideal fuer"
          isDetailsOpen={isDetailsOpen}
          isRecommended={isRecommended}
          moreItemsPluralLabel="weitere Punkte"
          moreItemsSingularLabel="weiterer Punkt"
          onCardSelectAction={vi.fn()}
          onDetailsToggleAction={setIsDetailsOpen}
          onPointerLeaveAction={vi.fn()}
          onPointerMoveAction={vi.fn()}
          recommendedBadgeLabel="Empfohlen"
        />
      );
    }

    const { container, rerender } = render(
      <FeaturedServiceCardHarness isRecommended={false} />,
    );

    expect(screen.getByText("Struktur & Wireframe")).toBeTruthy();
    expect(screen.getByText("Performance-Optimierung")).toBeTruthy();
    expect(screen.queryByText("Tracking-Setup")).toBeNull();
    expect(screen.getByText("+ 3 weitere Punkte")).toBeTruthy();
    expect(
      container
        .querySelector("[data-card-key='landing']")
        ?.getAttribute("data-service-expanded"),
    ).toBe("false");
    expect(
      screen.queryByRole("link", { name: "Landingpage anfragen" }),
    ).toBeNull();

    rerender(<FeaturedServiceCardHarness />);

    expect(
      screen
        .getByRole("link", { name: "Landingpage anfragen" })
        .getAttribute("data-project-offer"),
    ).toBe("landing");

    fireEvent.click(container.querySelector("article") as HTMLElement);

    expect(screen.getByText("Tracking-Setup")).toBeTruthy();
    expect(
      container
        .querySelector("[data-card-key='landing']")
        ?.getAttribute("data-service-expanded"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: /Mehr Infos/i })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });
});
