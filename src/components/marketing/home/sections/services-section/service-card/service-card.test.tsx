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
          fitLabel="Ideal für"
          isCtaActive
          isDetailsOpen={isDetailsOpen}
          isRecommended
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

    const { container } = render(<ServiceCardHarness />);

    expect(screen.getByText("Ideal für")).toBeTruthy();
    expect(
      screen.getByText("Angebotsseiten mit klarer Conversion-Aktion."),
    ).toBeTruthy();
    expect(
      screen.getByText("Schnell live & conversion-fokussiert"),
    ).toBeTruthy();
    expect(
      screen.getByText("Angebot nach Ziel, Umfang und Feedbackbedarf"),
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
          highlight: "Fewer manual steps in daily work",
          pricingHint: "Calculated by workflow, data, and integrations",
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
        onPointerLeaveAction={vi.fn()}
        onPointerMoveAction={vi.fn()}
        recommendedBadgeLabel="Recommended"
      />,
    );

    expect(screen.getByText("+ 1 more item")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("keeps compact primary card content in the DOM while gating the CTA", () => {
    function CompactCardHarness({ isCtaActive = false }) {
      const [isDetailsOpen, setIsDetailsOpen] = useState(false);

      return (
        <ServiceCard
          card={{
            key: "upgrade",
            title: "Website upgrade",
            description: "Improve an existing site.",
            fit: "Existing sites with a solid base.",
            iconSrc: "/services/upgrade-icon.svg",
            iconAlt: "Upgrade icon",
            highlight: "Noticeable UX and speed improvement",
            pricingHint: "Calculated by current state and intervention depth",
            delivery: "3-10 days",
            included: ["Analysis", "UX", "Performance", "Handover"],
          }}
          ctaProjectGoal="improve an existing site"
          ctaLabel="Request project"
          defaultDeliveryLabel="Typical"
          detailsCtaLabel="More info"
          fitLabel="Ideal for"
          isCompact
          isCtaActive={isCtaActive}
          isDetailsOpen={isDetailsOpen}
          moreItemsPluralLabel="more items"
          moreItemsSingularLabel="more item"
          onCardSelectAction={vi.fn()}
          onDetailsToggleAction={setIsDetailsOpen}
          onPointerLeaveAction={vi.fn()}
          onPointerMoveAction={vi.fn()}
          recommendedBadgeLabel="Recommended"
        />
      );
    }

    const { rerender } = render(<CompactCardHarness />);

    expect(screen.getByText("Website upgrade")).toBeTruthy();
    expect(screen.getByText("Ideal for")).toBeTruthy();
    expect(screen.getByText("Existing sites with a solid base.")).toBeTruthy();
    expect(
      screen.getByText("Noticeable UX and speed improvement"),
    ).toBeTruthy();
    expect(screen.getByText("Typical: 3-10 days")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Request project" })).toBeNull();
    expect(screen.getByRole("button", { name: /More info/i })).toBeTruthy();
    expect(
      screen.getByText("Calculated by current state and intervention depth"),
    ).toBeTruthy();
    expect(screen.getByText("Analysis")).toBeTruthy();
    expect(screen.getByText("+ 1 more item")).toBeTruthy();
    expect(
      document
        .querySelector("[data-card-key='upgrade']")
        ?.getAttribute("data-service-expanded"),
    ).toBe("false");

    rerender(<CompactCardHarness isCtaActive />);

    expect(screen.getByRole("link", { name: "Request project" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /More info/i }));

    expect(
      document
        .querySelector("[data-card-key='upgrade']")
        ?.getAttribute("data-service-expanded"),
    ).toBe("true");
    expect(
      screen.getByText("Calculated by current state and intervention depth"),
    ).toBeTruthy();
    expect(screen.getByText("Analysis")).toBeTruthy();
    expect(screen.getByText("+ 1 more item")).toBeTruthy();
  });
});
