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
        name: "Klarer Rahmen, saubere Umsetzung",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Scope vor dem Start")).toBeTruthy();
    expect(screen.getByText("Direkte Abstimmung im Projekt")).toBeTruthy();
    expect(screen.getByText("Launchbereit übergeben")).toBeTruthy();
    expect(
      screen.getByText(
        "Nach der Anfrage ist schnell klar, welcher Einstieg passt und was der nächste Schritt ist.",
      ),
    ).toBeTruthy();
  });
});
