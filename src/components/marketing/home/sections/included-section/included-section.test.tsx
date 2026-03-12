// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getHomeUiContent } from "@/i18n/dictionaries/marketing/home-ui";
import { IncludedSection } from "./included-section";

describe("IncludedSection", () => {
  it("renders the included-section content without legacy proof framing", () => {
    const includedContent = getHomeUiContent("de").includedContent;

    render(<IncludedSection id="included" includedContent={includedContent} />);

    expect(
      screen.getByRole("heading", {
        name: "Vom ersten Scope bis zur Übergabe",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText("Passender Einstieg vor Projektbeginn"),
    ).toBeTruthy();
    expect(screen.getByText("Kurze Wege im Projekt")).toBeTruthy();
    expect(screen.getByText("Launch sauber vorbereitet")).toBeTruthy();
    expect(
      screen.getByText(
        "Nach der Anfrage weißt du, welcher Einstieg sinnvoll ist und wie es konkret weitergeht.",
      ),
    ).toBeTruthy();
  });
});
