// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
}));

vi.mock("@/components/marketing/home/marketing-home-page-client", () => ({
  MarketingHomePageClient: () => <div data-testid="home-page" />,
}));

import { generateMetadata } from "./page";

describe("LocalePage metadata", () => {
  it("uses the shared static OG image for the German homepage", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "de" }),
    });

    expect(metadata.alternates?.canonical).toBe("https://www.invessiv.com/de");
    expect(metadata.openGraph?.url).toBe("https://www.invessiv.com/de");
    expect(metadata.openGraph?.images).toEqual([
      {
        alt: "Invessiv Landingpage-Angebot für Selbstständige und kleine Unternehmen",
        height: 630,
        url: "https://www.invessiv.com/og/landing.png",
        width: 1200,
      },
    ]);
    expect(metadata.twitter?.images).toEqual([
      {
        alt: "Invessiv Landingpage-Angebot für Selbstständige und kleine Unternehmen",
        url: "https://www.invessiv.com/og/landing.png",
      },
    ]);
  });
});
