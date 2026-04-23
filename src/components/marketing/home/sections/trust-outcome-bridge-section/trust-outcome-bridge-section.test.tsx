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
        name: "Klarer Einstieg. Saubere Umsetzung. Ein nächster Schritt, der passt.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Landingpage, Webseite oder Upgrade: Nach deiner Anfrage bekommst du eine kurze Einschätzung und ein klares Angebot vor Start.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Einschätzung zu Landingpage, Webseite oder Upgrade"),
    ).toBeTruthy();
    expect(screen.getByText("Transparentes Angebot vor Start")).toBeTruthy();
    expect(
      screen.getByText("Echte Projekte und 5,0 Google Bewertung"),
    ).toBeTruthy();
    expect(
      screen.queryByText("Passender Einstieg vor Projektbeginn"),
    ).toBeNull();
  });
});
