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

  it("renders the updated hero messaging with effort-focused pills", () => {
    render(
      <HeroSection
        description="Landingpages, Webseiten, Upgrades und Interne Tools für Dienstleister und KMU, die ihr Angebot klar zeigen und interne Abläufe spürbar einfacher, besser oder schneller machen wollen."
        heroPrimaryCta="Projekt anfragen"
        heroSecondaryCta="Leistung passend einschätzen"
        heroTag="MEHR ANFRAGEN, EINFACHERE PROZESSE"
        heroVisualAriaLabel="Hero visual preview"
        primaryCtaAnalyticsTarget="form"
        primaryCtaHref="#contact"
        secondaryCtaAnalyticsTarget="services"
        secondaryCtaHref="#services"
        title="Digitale Lösungen,\ndie zu passenden Anfragen führen und interne Arbeit entlasten."
        trackingLocation="hero"
      />,
    );

    const heroHeading = screen.getByRole("heading", { level: 1 });
    expect(heroHeading.textContent).toContain("Digitale Lösungen,");
    expect(heroHeading.textContent).toContain(
      "die zu passenden Anfragen führen und interne Arbeit entlasten.",
    );
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
        trackingLocation="landing_hero"
        primaryCtaAnalyticsTarget="footer"
        secondaryCtaAnalyticsTarget="footer"
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
