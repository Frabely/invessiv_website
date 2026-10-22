// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HeroSection } from "./hero-section";

vi.mock("@/components/marketing/hero-visual/hero-visual", () => ({
  HeroVisual: ({ ariaLabel }: { ariaLabel: string }) => (
    <div aria-label={ariaLabel}>Hero visual</div>
  ),
}));

vi.mock("@/components/providers/theme-provider", () => ({
  useTheme: () => ({ theme: "dark", setTheme: vi.fn(), toggleTheme: vi.fn() }),
}));

describe("HeroSection", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: query === "(min-width: 901px)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });
  });

  it("renders the personal web design messaging, CTA targets, and custom photo slot", () => {
    render(
      <HeroSection
        description="Ich entwickle klar strukturierte Websites für KMU und Dienstleister in Chemnitz."
        fullscreenVisual
        heroPrimaryCta="Kostenloses Erstgespräch anfragen"
        heroSecondaryCta="Leistungen ansehen"
        heroTag="WEBDESIGN AUS CHEMNITZ UND UMGEBUNG"
        heroTrustChips={[
          "Direkter Ansprechpartner",
          "Softwareentwicklungs-Background",
        ]}
        primaryCtaAnalytics={{
          cta: "home_hero_primary",
          target: "contact_form",
        }}
        primaryCtaHref="#contact"
        secondaryCtaAnalytics={{
          cta: "home_hero_secondary",
          target: "services",
        }}
        secondaryCtaHref="#services"
        title="Websites, die Vertrauen schaffen und Dir Anfragen bringen."
        visualSlot={
          <span
            aria-label="Moritz Hecht, persönlicher Ansprechpartner für Webdesign aus Chemnitz"
            role="img"
          />
        }
      />,
    );

    const heroHeading = screen.getByRole("heading", { level: 1 });
    expect(heroHeading.textContent).toBe(
      "Websites, die Vertrauen schaffen und Dir Anfragen bringen.",
    );
    expect(
      screen
        .getByRole("link", { name: "Kostenloses Erstgespräch anfragen" })
        .getAttribute("href"),
    ).toBe("#contact");
    const secondaryLink = screen.getByRole("link", {
      name: "Leistungen ansehen",
    });
    expect(secondaryLink.getAttribute("href")).toBe("#services");
    expect(secondaryLink.dataset.analyticsEvent).toBe("cta_clicked");
    expect(JSON.parse(secondaryLink.dataset.analyticsPayload ?? "{}")).toEqual({
      cta: "home_hero_secondary",
      target: "services",
    });
    const directContactChip = screen.getByText("Direkter Ansprechpartner");
    expect(directContactChip).toBeTruthy();
    expect(screen.getByText("Softwareentwicklungs-Background")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      secondaryLink.compareDocumentPosition(directContactChip) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.getByRole("img", {
        name: "Moritz Hecht, persönlicher Ansprechpartner für Webdesign aus Chemnitz",
      }),
    ).toBeTruthy();
    expect(screen.queryByText("Hero visual")).toBeNull();
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
        primaryCtaAnalytics={{
          cta: "landing_hero_primary",
          target: "contact_form",
        }}
        secondaryCtaAnalytics={{
          cta: "landing_hero_secondary",
          target: "process",
        }}
        title="Landingpages"
      />,
    );

    const primaryLink = screen.getByRole("link", { name: "Check anfragen" });
    const secondaryLink = screen.getByRole("link", { name: "Footer ansehen" });

    expect(primaryLink.getAttribute("href")).toBe("#footer");
    expect(JSON.parse(primaryLink.dataset.analyticsPayload ?? "{}")).toEqual({
      cta: "landing_hero_primary",
      target: "contact_form",
    });
    expect(secondaryLink.getAttribute("href")).toBe("#footer");
    expect(JSON.parse(secondaryLink.dataset.analyticsPayload ?? "{}")).toEqual({
      cta: "landing_hero_secondary",
      target: "process",
    });
  });

  it("renders an optional decorative background video in dark mode", () => {
    const { container } = render(
      <HeroSection
        description="Kurze Beschreibung"
        heroPrimaryCta="Check anfragen"
        heroSecondaryCta="Footer ansehen"
        heroTag="Landing"
        heroVideoSrc="/spotlight.mp4"
        heroVisualAriaLabel="Hero visual preview"
        primaryCtaHref="#footer"
        secondaryCtaHref="#footer"
        primaryCtaAnalytics={{
          cta: "landing_hero_primary",
          target: "contact_form",
        }}
        secondaryCtaAnalytics={{
          cta: "landing_hero_secondary",
          target: "process",
        }}
        title="Landingpages"
      />,
    );

    const video = container.querySelector("video");

    expect(video).toBeTruthy();
    expect(video?.getAttribute("preload")).toBe("metadata");
    expect(video?.muted).toBe(true);
    expect(video?.playsInline).toBe(true);
    expect(video?.getAttribute("src")).toBe("/spotlight.mp4");
  });
});
