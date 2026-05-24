// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomeUiContent } from "@/i18n/dictionaries/marketing/home-ui";
import { TrustOutcomeBridgeSection } from "./trust-outcome-bridge-section";

describe("TrustOutcomeBridgeSection", () => {
  it("renders a compact lead bridge without legacy cards", () => {
    render(
      <TrustOutcomeBridgeSection
        content={getHomeUiContent("de").leadBridgeContent}
        id="lead-bridge"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Landingpage, Website, Upgrade oder Tool — je nach Ziel.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Ich entwickle Landingpages, Webseiten, Upgrades und interne Tools für mehr passende Anfragen oder effizientere Abläufe. Welche Leistung für dein Ziel passt, klären wir ehrlich vor dem Start.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Ehrliche Einschätzung vor dem Start"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Für mehr Anfragen oder produktivere Abläufe — je nach Ziel",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Nur das, was dein Projekt wirklich braucht"),
    ).toBeTruthy();
    expect(
      screen.queryByText("Passender Einstieg vor Projektbeginn"),
    ).toBeNull();
  });
});
