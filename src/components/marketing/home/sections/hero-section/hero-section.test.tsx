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
        title="Landingpages,\ndie passende Anfragen bringen."
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
    expect(
      screen
        .getByRole("link", { name: "Leistung passend einschätzen" })
        .getAttribute("href"),
    ).toBe("#services");
    expect(screen.queryByText("KI-Agenten-Workflow")).toBeNull();
  });
});
