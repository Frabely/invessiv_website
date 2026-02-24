// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PackagesSection } from "./packages-section";

describe("PackagesSection", () => {
  it("renders package cards with primary and secondary actions", () => {
    render(
      <PackagesSection
        description="Wähle das passende Paket und bringe dein Projekt zügig online."
        id="pricing"
        packageCards={[
          {
            ctaHref: "#contact",
            ctaLabel: "Projekt anfragen",
            idealFor: "Perfekt für Landingpages",
            name: "Start",
            price: "ab 99€ / Monat",
            scope: ["Moderne Landingpages", "Responsive Design"],
            secondaryCtaHref: "#services",
            secondaryCtaLabel: "Leistungen ansehen",
            timeline: "Launch in wenigen Tagen",
          },
          {
            ctaHref: "#contact",
            ctaLabel: "Projekt anfragen",
            featured: true,
            idealFor: "Professionelle Webseiten",
            name: "Business",
            price: "ab 199€ / Monat",
            scope: ["Individuelles Design", "CMS & Pflegeleicht"],
            secondaryCtaHref: "#services",
            secondaryCtaLabel: "Leistungen ansehen",
            timeline: "Launch in 7-10 Tagen",
          },
        ]}
        recommendedBadgeLabel="Empfohlen"
        title="Pakete, die schnell live gehen."
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Pakete, die schnell live gehen." }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { name: "Start" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("heading", { name: "Business" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Empfohlen").length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole("link", { name: "Projekt anfragen" })[0]
        ?.getAttribute("href"),
    ).toBe("#contact");
    expect(
      screen
        .getAllByRole("link", { name: "Leistungen ansehen" })[0]
        ?.getAttribute("href"),
    ).toBe("#services");
  });
});
