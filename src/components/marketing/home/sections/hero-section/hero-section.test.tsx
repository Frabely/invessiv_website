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
        description="Für Unternehmen, die online klarer auftreten, mehr passende Anfragen gewinnen und ihre Website als Vertriebsfläche nutzen wollen."
        heroPrimaryCta="Projekt anfragen"
        heroSecondaryCta="Leistungsmodelle"
        heroTag="KLARER AUFBAU, DIREKTE UMSETZUNG"
        heroVisualAriaLabel="Hero visual preview"
        title="Landingpages und Webseiten,\ndie Anfragen erzeugen."
      />,
    );

    const heroHeading = screen.getByRole("heading", { level: 1 });
    expect(heroHeading.textContent).toContain("Landingpages und Webseiten,");
    expect(heroHeading.textContent).toContain("die Anfragen erzeugen.");
    expect(
      screen
        .getByRole("link", { name: "Projekt anfragen" })
        .getAttribute("href"),
    ).toBe("#contact");
    expect(
      screen
        .getByRole("link", { name: "Leistungsmodelle" })
        .getAttribute("href"),
    ).toBe("#services");
    expect(screen.queryByText("KI-Agenten-Workflow")).toBeNull();
  });
});
