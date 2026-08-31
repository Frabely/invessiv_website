// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomePage } from "./home-page";

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({
    locale: "de",
  }),
}));

vi.mock(
  "@/components/marketing/home/sections/hero-section/hero-section",
  () => ({
    HeroSection: () => <section data-testid="home-hero" />,
  }),
);

vi.mock("@/components/marketing/site-header/site-header", () => ({
  SiteHeader: () => <header data-testid="site-header" />,
}));

vi.mock(
  "@/components/marketing/shared/anchor-offset-scroll/anchor-offset-scroll",
  () => ({
    AnchorOffsetScroll: () => null,
  }),
);

vi.mock("@/lib/analytics/conversion-events", () => ({
  trackConversionEvent: vi.fn(),
}));

vi.mock("@/hooks/marketing/use-process-journey", () => ({
  useProcessJourney: () => undefined,
}));

vi.mock("@/hooks/marketing/use-services-card-reveal", () => ({
  useServicesCardReveal: () => undefined,
}));

afterEach(() => {
  cleanup();
});

describe("HomePage", () => {
  it("makes the free intro call the primary contact form", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Lass uns über dein Vorhaben sprechen.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Kostenloses Erstgespräch anfragen/ }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("combobox", { name: /Passendes Angebot/ }),
    ).toBeNull();
  });

  it("offers the three optional service models without a preselection", () => {
    render(<HomePage />);

    const scopeGroup = screen.getByRole("group", { name: /Leistungsmodell/ });
    const scopeOptions = within(scopeGroup).getAllByRole("radio");

    expect(scopeOptions).toHaveLength(3);
    expect(
      scopeOptions.every((option) => !(option as HTMLInputElement).checked),
    ).toBe(true);
  });

  it("renders the hero and all enabled content sections in their configured order", () => {
    render(<HomePage />);

    const hero = screen.getByTestId("home-hero");
    const problemHeading = screen.getByRole("heading", {
      name: "Hast du mindestens eines dieser Probleme?",
    });
    const uspHeading = screen.getByRole("heading", {
      name: "Warum du mit mir arbeiten solltest",
    });
    const servicesHeading = screen.getByRole("heading", {
      name: "Was hast du mit deiner Website vor?",
    });
    const referencesHeading = screen.getByRole("heading", {
      name: "Was entsteht, wenn wir zusammenarbeiten?",
    });

    expect(
      hero.compareDocumentPosition(problemHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      problemHeading.compareDocumentPosition(uspHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      uspHeading.compareDocumentPosition(servicesHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      servicesHeading.compareDocumentPosition(referencesHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
