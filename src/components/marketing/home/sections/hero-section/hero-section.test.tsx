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
        description="Von Landingpage bis Prozess-Tool: mit sauberem Setup, direkter Abstimmung und einem Ergebnis, das vor dem Launch geprüft ist."
        heroBenefitsAriaLabel="Kurzvorteile"
        heroChipTags={[
          "Transparente Aufwandseinschaetzung",
          "Ein Ansprechpartner",
          "QA vor Go-live",
        ]}
        heroPrimaryCta="Projekt anfragen"
        heroSecondaryCta="Leistungsmodelle"
        heroTag="KLARER AUFBAU, DIREKTE UMSETZUNG"
        heroVisualAriaLabel="Hero visual preview"
        title="Webseiten und Prozess-Tools mit durchdachtem Aufbau und direktem Weg zum Ziel."
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Webseiten und Prozess-Tools mit durchdachtem Aufbau und direktem Weg zum Ziel.",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Transparente Aufwandseinschaetzung")).toBeTruthy();
    expect(screen.getByText("Ein Ansprechpartner")).toBeTruthy();
    expect(screen.getByText("QA vor Go-live")).toBeTruthy();
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
