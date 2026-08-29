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
  it("passes the three canonical offer options into the project request select", () => {
    render(<HomePage showProofSection />);

    const offerSelect = screen.getByRole("combobox", {
      name: /Passendes Angebot/,
    });

    expect(
      screen.getByRole("option", { name: "Webauftritt & Landingpages" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("option", { name: "Wartung & Support" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("option", {
        name: "Prozessoptimierung & digitale Workflows",
      }),
    ).toBeTruthy();
    expect(offerSelect.textContent).not.toContain("Webseite");
    expect(offerSelect.textContent).not.toContain("Webseiten-Upgrade");
    expect(offerSelect.textContent).not.toContain("KI-Templates & Agents");
  });

  it("renders the hero and all enabled content sections in their configured order", () => {
    render(<HomePage showProofSection />);

    const hero = screen.getByTestId("home-hero");
    const bridgeHeading = screen.getByRole("heading", {
      name: "Landingpage, Website, Upgrade oder Tool — je nach Ziel.",
    });
    const servicesHeading = screen.getByRole("heading", {
      name: "Was brauchst du gerade?",
    });
    const proofHeading = screen.getByRole("heading", {
      name: "Was Kunden über die Zusammenarbeit sagen",
    });

    expect(
      hero.compareDocumentPosition(bridgeHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      bridgeHeading.compareDocumentPosition(servicesHeading) &
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
