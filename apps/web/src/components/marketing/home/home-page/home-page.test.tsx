// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
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

vi.mock("@/hooks/marketing/use-process-start-point", () => ({
  useProcessStartPoint: () => undefined,
}));

vi.mock("@/hooks/marketing/use-services-card-reveal", () => ({
  useServicesCardReveal: () => undefined,
}));

afterEach(() => {
  cleanup();
});

describe("HomePage", () => {
  it("keeps the project request select focused on web design and support", () => {
    render(<HomePage />);

    const offerSelect = screen.getByRole("combobox", {
      name: /Passendes Angebot/,
    });

    expect(screen.getByRole("option", { name: "Landingpage" })).toBeTruthy();
    expect(
      screen.getByRole("option", { name: "Wartung & Support" }),
    ).toBeTruthy();
    expect(offerSelect.textContent).not.toContain("Prozessoptimierung");
    expect(offerSelect.querySelectorAll("option")).toHaveLength(3);
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
