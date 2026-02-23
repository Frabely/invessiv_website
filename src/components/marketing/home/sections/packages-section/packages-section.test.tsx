// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PackagesSection } from "./packages-section";

describe("PackagesSection", () => {
  it("renders all package cards with CTA links", () => {
    render(
      <PackagesSection
        assurances={["1–2 Feedbackrunden inklusive"]}
        description="Klare Pakete"
        id="pricing"
        packageCards={[
          {
            ctaHref: "#contact",
            ctaLabel: "Starter anfragen",
            idealFor: "Ideal fuer Landingpages",
            name: "Starter",
            price: "ab 1.900 EUR",
            scope: ["Scope A", "Scope B"],
            timeline: "5 Tage",
          },
          {
            ctaHref: "#contact",
            ctaLabel: "Growth anfragen",
            featured: true,
            idealFor: "Ideal fuer Webseiten",
            name: "Growth",
            price: "ab 4.900 EUR",
            scope: ["Scope C", "Scope D"],
            timeline: "10 Tage",
          },
        ]}
        sectionCta={{
          hint: "Unverbindlich. Antwort in 24h.",
          href: "#contact",
          label: "Scope anfragen",
        }}
        summary="Start in 3–5 Werktagen"
        title="Pakete"
      />,
    );

    expect(screen.getByRole("heading", { name: "Pakete" })).toBeTruthy();
    expect(screen.getByText("Start in 3–5 Werktagen")).toBeTruthy();
    expect(screen.getByText("1–2 Feedbackrunden inklusive")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Starter" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Growth" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Starter anfragen" }).getAttribute("href"),
    ).toBe("#contact");
    expect(
      screen.getByRole("link", { name: "Growth anfragen" }).getAttribute("href"),
    ).toBe("#contact");
    expect(screen.getByRole("link", { name: "Scope anfragen" }).getAttribute("href")).toBe(
      "#contact",
    );
  });
});
