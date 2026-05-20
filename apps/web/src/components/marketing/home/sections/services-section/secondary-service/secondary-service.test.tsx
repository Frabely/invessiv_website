// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecondaryService } from "./secondary-service";

describe("SecondaryService", () => {
  it("renders a quieter secondary card with a text CTA instead of a button", () => {
    render(
      <SecondaryService
        addonBadgeLabel="Add-on"
        card={{
          key: "maintenance",
          title: "Wartung & Support",
          description: "Schnelle Weiterentwicklung und saubere Pflege.",
          fit: "Sinnvoll, wenn bestehende Seiten laufend angepasst werden sollen.",
          iconSrc: "/services/customer-service-icon.svg",
          iconAlt: "Support Icon",
          highlight: "schnelle Hilfe für laufende Themen",
          pricingHint: "Nach Aufwand oder abgestimmtem Betreuungspaket",
          delivery: "24-72h",
          included: ["Bugfixes", "Checks", "Pflege"],
        }}
        ctaLabel="Wartung & Support anfragen"
        ctaProjectGoal="mehr Anfragen gewinnen"
        defaultDeliveryLabel="Reaktionszeit"
        detailsCtaLabel="Mehr Infos"
      />,
    );

    expect(screen.getByText("Wartung & Support")).toBeTruthy();
    expect(screen.getByText("Add-on")).toBeTruthy();
    expect(screen.getByText("schnelle Hilfe für laufende Themen")).toBeTruthy();
    expect(screen.getByText(/Reaktionszeit:\s*24-72h/i)).toBeTruthy();
    expect(
      screen.getByText("Nach Aufwand oder abgestimmtem Betreuungspaket"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Sinnvoll, wenn bestehende Seiten laufend angepasst werden sollen.",
      ),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: /Mehr Infos/i })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    expect(
      screen
        .getByText("Wartung & Support")
        .closest("article")
        ?.getAttribute("data-service-expanded"),
    ).toBe("false");
    expect(
      screen.getByRole("link", { name: "Wartung & Support anfragen" }),
    ).toBeTruthy();
    const article = screen.getByText("Wartung & Support").closest("article");

    fireEvent.click(article as HTMLElement);
    expect(
      screen
        .getByRole("button", { name: /Mehr Infos/i })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    expect(
      screen
        .getByText("Wartung & Support")
        .closest("article")
        ?.getAttribute("data-service-expanded"),
    ).toBe("true");
    fireEvent.click(
      screen.getByRole("link", { name: "Wartung & Support anfragen" }),
    );
    expect(
      screen
        .getByText("Wartung & Support")
        .closest("article")
        ?.getAttribute("data-service-expanded"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /Mehr Infos/i }));
    expect(
      screen
        .getByText("Wartung & Support")
        .closest("article")
        ?.getAttribute("data-service-expanded"),
    ).toBe("false");
    expect(
      screen
        .getByText("Wartung & Support")
        .closest("article")
        ?.getAttribute("tabindex"),
    ).toBeNull();
  });
});
