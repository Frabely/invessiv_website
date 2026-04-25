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
        name: "Landingpages zuerst. Webseiten, Upgrades oder Tools nur, wenn sie sinnvoll ergänzen.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Ich entwickle vor allem Landingpages, die Angebote klar vermitteln und Besucher zur Anfrage führen. Webseiten, Upgrades oder Prozessoptimierungs-Tools kommen nur dazu, wenn sie den nächsten Schritt wirklich unterstützen.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Ehrliche Einschätzung vor dem Start"),
    ).toBeTruthy();
    expect(
      screen.getByText("Landingpages mit klarem Conversion-Ziel"),
    ).toBeTruthy();
    expect(
      screen.getByText("Website, Upgrade oder Tool nur bei Bedarf"),
    ).toBeTruthy();
    expect(
      screen.queryByText("Passender Einstieg vor Projektbeginn"),
    ).toBeNull();
  });
});
