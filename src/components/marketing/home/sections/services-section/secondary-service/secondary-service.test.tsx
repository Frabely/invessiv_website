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
        isSelected
        onSelectAction={() => undefined}
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
    expect(screen.queryByRole("button")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Wartung & Support anfragen" }),
    ).toBeTruthy();
  });

  it("calls the select action on click and keyboard confirmation", () => {
    let selectionCount = 0;

    render(
      <SecondaryService
        addonBadgeLabel="Add-on"
        card={{
          key: "upgrade",
          title: "Website-Upgrade",
          description: "Bestehendes verbessern.",
          fit: "Für Seiten mit Potenzial.",
          iconSrc: "/services/upgrade-icon.svg",
          iconAlt: "Upgrade Icon",
          highlight: "spürbare UX- und Speed-Verbesserung",
          pricingHint: "Angebot nach Ist-Zustand und Eingriffstiefe",
          delivery: "2-5 Tage",
          included: ["Analyse"],
        }}
        ctaLabel="Upgrade anfragen"
        defaultDeliveryLabel="Typisch"
        onSelectAction={() => {
          selectionCount += 1;
        }}
      />,
    );

    const article = screen.getByText("Website-Upgrade").closest("article");

    fireEvent.click(article as HTMLElement);
    fireEvent.keyDown(article as HTMLElement, { key: "Enter" });

    expect(selectionCount).toBe(2);
  });
});
