// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getHomeSections } from "@/i18n/dictionaries/marketing/home";
import { getHomeUiContent } from "@/i18n/dictionaries/marketing/home-ui";
import { HomeSectionsRenderer } from "./home-sections-renderer";

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({
    locale: "de",
  }),
}));

vi.mock("@/lib/analytics/conversion-events", () => ({
  trackConversionEvent: vi.fn(),
}));

vi.mock("@/hooks/marketing/use-process-start-point", () => ({
  useProcessStartPoint: () => undefined,
}));

afterEach(() => {
  cleanup();
});

const sections = getHomeSections("de");

describe("HomeSectionsRenderer", () => {
  it("passes the five active services into the project request select", () => {
    render(
      <HomeSectionsRenderer
        landingPageServiceHref="/de/services/landing-page"
        sections={sections}
        servicesSectionRef={createRef<HTMLElement>()}
        showProofSection={true}
        ui={getHomeUiContent("de")}
        validation={{
          hasCompleteMapping: true,
          missingInNavigation: [],
          missingInSections: [],
        }}
      />,
    );

    const offerSelect = screen.getByRole("combobox", {
      name: /Passendes Leistungsmodell\s*\*/,
    });

    expect(screen.getByRole("option", { name: "Webseite" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Landingpage" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Internes Tool" })).toBeTruthy();
    expect(
      screen.getByRole("option", { name: "Webseiten-Upgrade" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("option", { name: "Wartung & Support" }),
    ).toBeTruthy();
    expect(offerSelect.textContent).not.toContain("KI-Templates & Agents");
  });

  it("renders the lead bridge before services and proof after services", () => {
    render(
      <HomeSectionsRenderer
        landingPageServiceHref="/de/services/landing-page"
        sections={sections}
        servicesSectionRef={createRef<HTMLElement>()}
        showProofSection={true}
        ui={getHomeUiContent("de")}
        validation={{
          hasCompleteMapping: true,
          missingInNavigation: [],
          missingInSections: [],
        }}
      />,
    );

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
      bridgeHeading.compareDocumentPosition(servicesHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      servicesHeading.compareDocumentPosition(proofHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("does not render the proof section while the launch flag is disabled", () => {
    render(
      <HomeSectionsRenderer
        landingPageServiceHref="/de/services/landing-page"
        sections={sections}
        servicesSectionRef={createRef<HTMLElement>()}
        showProofSection={false}
        ui={getHomeUiContent("de")}
        validation={{
          hasCompleteMapping: true,
          missingInNavigation: [],
          missingInSections: [],
        }}
      />,
    );

    expect(
      screen.queryByRole("heading", {
        name: "Was Kunden über die Zusammenarbeit sagen",
      }),
    ).not.toBeInTheDocument();
  });
});
