// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeroSection } from "@/components/marketing/home/sections/hero-section/hero-section";

import { HeroZoomReplica } from "./hero-zoom-replica";

vi.mock("@/components/marketing/hero-visual/hero-visual", () => ({
  HeroVisual: ({ ariaLabel }: { ariaLabel: string }) => (
    <div aria-label={ariaLabel}>Hero visual</div>
  ),
}));

describe("HeroZoomReplica", () => {
  afterEach(() => {
    cleanup();
  });

  it("wraps the decorative hero without heading, links, ids or analytics", () => {
    const { container } = render(
      <HeroZoomReplica>
        <HeroSection
          decorative
          description="Kurze Beschreibung"
          heroPrimaryCta="Check anfragen"
          heroSecondaryCta="Footer ansehen"
          heroTag="Landing"
          heroVisualAriaLabel="Hero visual preview"
          primaryCtaHref="#footer"
          secondaryCtaHref="#footer"
          trackingLocation="landing_hero"
          primaryCtaAnalyticsTarget="footer"
          secondaryCtaAnalyticsTarget="footer"
          title="Landingpages"
        />
      </HeroZoomReplica>,
    );

    const replica = container.querySelector("[data-hero-zoom-replica]");

    expect(replica).toBeTruthy();
    expect(replica?.getAttribute("aria-hidden")).toBe("true");
    expect(replica?.hasAttribute("inert")).toBe(true);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(container.querySelector("h1")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("#hero")).toBeNull();
    expect(container.querySelector("[data-analytics-event]")).toBeNull();
  });
});
