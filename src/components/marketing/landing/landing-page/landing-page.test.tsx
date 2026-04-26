// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LandingPage } from "./landing-page";

vi.mock("@/components/marketing/site-header/site-header", () => ({
  SiteHeader: ({
    ctaHref,
    navigation,
  }: {
    ctaHref: string;
    navigation: Array<{ href: string }>;
  }) => (
    <header data-cta-href={ctaHref} data-testid="site-header">
      {navigation.map((item) => (
        <a href={item.href} key={item.href}>
          {item.href}
        </a>
      ))}
    </header>
  ),
}));

vi.mock("@/components/marketing/hero-visual/hero-visual", () => ({
  HeroVisual: ({ ariaLabel }: { ariaLabel: string }) => (
    <aside aria-label={ariaLabel} data-testid="hero-visual" />
  ),
}));

describe("LandingPage", () => {
  it("renders the landing skeleton with header, problem section, hero visual, and footer", async () => {
    render(<LandingPage locale="de" />);

    expect(
      screen.getByTestId("site-header").getAttribute("data-cta-href"),
    ).toBe("#footer");
    expect(
      screen.getByTestId("site-header").querySelector('a[href="#problem"]'),
    ).toBeTruthy();
    expect(
      screen.getByTestId("site-header").querySelector('a[href="#solution"]'),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "Mehr Anfragen",
    );
    expect(
      screen.getByText(/Keine große Website\. Kein unnötiger Umfang\./),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Viele Websites sehen okay aus/,
      }),
    ).toBeTruthy();
    const firstProblemItem = screen.getByText("Was genau angeboten wird");
    expect(firstProblemItem).toBeTruthy();
    await waitFor(() => {
      expect(firstProblemItem.closest("li")?.dataset.visible).toBe("true");
    });
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Eine Landingpage führt Besucher gezielt zur Anfrage/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(/Sie erklärt verständlich, was du anbietest/),
    ).toBeTruthy();
    expect(screen.queryByText("Anfrage auslösen")).toBeNull();
    expect(screen.queryByText(/keine überladene Website/)).toBeNull();
    expect(screen.getByTestId("hero-visual")).toBeTruthy();
    expect(screen.getByRole("contentinfo")).toBeTruthy();
    expect(
      screen.getByRole("contentinfo").querySelector('a[href="#problem"]'),
    ).toBeTruthy();
    expect(
      screen.getByRole("contentinfo").querySelector('a[href="#solution"]'),
    ).toBeTruthy();
  });
});
