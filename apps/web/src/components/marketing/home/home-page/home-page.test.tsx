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
    render(<HomePage showProofSection />);

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
    render(<HomePage showProofSection />);

    const hero = screen.getByTestId("home-hero");
    const problemHeading = screen.getByRole("heading", {
      name: "Hast du mindestens eines dieser Probleme?",
    });
    const uspHeading = screen.getByRole("heading", {
      name: "Warum du mit mir arbeiten solltest",
    });
    const servicesHeading = screen.getByRole("heading", {
      name: "Welcher Webauftritt passt zu deinem Vorhaben?",
    });
    const proofHeading = screen.getByRole("heading", {
      name: "Was Kunden über die Zusammenarbeit sagen",
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
      servicesHeading.compareDocumentPosition(proofHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("does not render the proof section while the launch flag is disabled", () => {
    render(<HomePage showProofSection={false} />);

    expect(
      screen.queryByRole("heading", {
        name: "Was Kunden über die Zusammenarbeit sagen",
      }),
    ).not.toBeInTheDocument();
  });
});
