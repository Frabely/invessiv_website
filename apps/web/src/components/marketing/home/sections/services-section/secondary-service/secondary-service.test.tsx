// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SecondaryService } from "./secondary-service";

describe("SecondaryService", () => {
  it("renders a collapsed alternative service row and selects it on click", () => {
    const onSelect = vi.fn();

    render(
      <SecondaryService
        card={{
          key: "process",
          title: "Internes Tool",
          description: "Maßgeschneiderte Tools für interne Abläufe.",
          fit: "Teams mit klaren Routineabläufen.",
          iconSrc: "/services/process-icon.svg",
          iconAlt: "Process Icon",
          highlight: "weniger manuelle Schritte im Alltag",
          pricingHint: "Kalkulation nach Workflow, Daten und Integrationen",
          delivery: "1-2 Wochen",
          included: ["Audit", "Konzept", "Setup", "Testing"],
        }}
        defaultDeliveryLabel="Zeitrahmen"
        isSelected={false}
        onSelectAction={onSelect}
      />,
    );

    expect(screen.getByText("Internes Tool")).toBeTruthy();
    expect(
      screen.getByText("Maßgeschneiderte Tools für interne Abläufe."),
    ).toBeTruthy();
    expect(screen.getByText(/Zeitrahmen:\s*1-2 Wochen/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Internes Tool/i }));

    expect(onSelect).toHaveBeenCalledWith("process");
    expect(
      screen
        .getByRole("button", { name: /Internes Tool/i })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });
});
