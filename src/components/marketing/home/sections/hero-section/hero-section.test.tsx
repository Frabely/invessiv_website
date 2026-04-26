// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HeroSection } from "./hero-section";

vi.mock("@/components/marketing/hero-visual/hero-visual", () => ({
  HeroVisual: ({ ariaLabel }: { ariaLabel: string }) => (
    <div aria-label={ariaLabel}>Hero visual</div>
  ),
}));

describe("HeroSection", () => {
  it("renders the updated hero messaging with effort-focused pills", () => {
    render(
      <HeroSection
        description="Für lokale und regionale Unternehmen, die ihr Angebot klar erklären, Vertrauen aufbauen und Besucher gezielt zur Projektanfrage führen wollen."
        heroPrimaryCta="Projekt anfragen"
        heroSecondaryCta="Leistung passend einschätzen"
        heroTag="KLARER AUFTRITT, MEHR ANFRAGEN"
        heroVisualAriaLabel="Hero visual preview"
        primaryCtaAnalyticsTarget="form"
        primaryCtaHref="#contact"
        secondaryCtaAnalyticsTarget="services"
        secondaryCtaHref="#services"
        title="Landingpages,\ndie passende Anfragen bringen."
        trackingLocation="hero"
      />,
    );

    const heroHeading = screen.getByRole("heading", { level: 1 });
    expect(heroHeading.textContent).toContain("Landingpages,");
    expect(heroHeading.textContent).toContain("die passende Anfragen bringen.");
    expect(
      screen
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("href"),
    ).toBe("#contact");
    const secondaryLink = screen.getByRole("link", {
      name: "Leistung passend einschätzen",
    });
    expect(secondaryLink.getAttribute("href")).toBe("#services");
    expect(secondaryLink.dataset.analyticsTarget).toBe("services");
    expect(screen.queryByText("KI-Agenten-Workflow")).toBeNull();
  });

  it("supports custom CTA targets for route-specific hero reuse", () => {
    render(
      <HeroSection
        description="Kurze Beschreibung"
        heroPrimaryCta="Check anfragen"
        heroSecondaryCta="Footer ansehen"
        heroTag="Landing"
        heroVisualAriaLabel="Hero visual preview"
        primaryCtaHref="#footer"
        secondaryCtaHref="#footer"
        trackingLocation="landing_hero"
        primaryCtaAnalyticsTarget="footer"
        secondaryCtaAnalyticsTarget="footer"
        title="Landingpages"
      />,
    );

    const primaryLink = screen.getByRole("link", { name: "Check anfragen" });
    const secondaryLink = screen.getByRole("link", { name: "Footer ansehen" });

    expect(primaryLink.getAttribute("href")).toBe("#footer");
    expect(primaryLink.dataset.analyticsLocation).toBe("landing_hero");
    expect(primaryLink.dataset.analyticsTarget).toBe("footer");
    expect(secondaryLink.getAttribute("href")).toBe("#footer");
    expect(secondaryLink.dataset.analyticsLocation).toBe("landing_hero");
    expect(secondaryLink.dataset.analyticsTarget).toBe("footer");
  });
});
