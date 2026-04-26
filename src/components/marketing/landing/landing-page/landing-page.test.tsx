// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LandingPage } from "./landing-page";

vi.mock("@/components/marketing/site-header/site-header", () => ({
  SiteHeader: ({
    ctaHref,
    navigation,
  }: {
    ctaHref: string;
    navigation: unknown[];
  }) => (
    <header data-cta-href={ctaHref} data-testid="site-header">
      {navigation.length}
    </header>
  ),
}));

vi.mock("@/components/marketing/hero-visual/hero-visual", () => ({
  HeroVisual: ({ ariaLabel }: { ariaLabel: string }) => (
    <aside aria-label={ariaLabel} data-testid="hero-visual" />
  ),
}));

describe("LandingPage", () => {
  it("renders the landing skeleton with header, hero visual, and footer", () => {
    render(<LandingPage locale="de" />);

    expect(
      screen.getByTestId("site-header").getAttribute("data-cta-href"),
    ).toBe("#footer");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "Mehr Anfragen",
    );
    expect(
      screen.getByText(/Keine große Website\. Kein unnötiger Umfang\./),
    ).toBeTruthy();
    expect(screen.getByTestId("hero-visual")).toBeTruthy();
    expect(screen.getByRole("contentinfo")).toBeTruthy();
  });
});
