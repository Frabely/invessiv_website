// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockLandingPage, mockNotFound } = vi.hoisted(() => ({
  mockLandingPage: vi.fn(() => <div data-testid="landing-page" />),
  mockNotFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("@/components/marketing/landing/landing-page/landing-page", () => ({
  LandingPage: mockLandingPage,
}));

import LandingRoute, { generateMetadata } from "./page";

describe("LandingRoute", () => {
  beforeEach(() => {
    mockLandingPage.mockClear();
    mockNotFound.mockClear();
  });

  it("renders the landing page for supported locales", async () => {
    const { container } = render(
      await LandingRoute({
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(screen.getByTestId("landing-page")).toBeTruthy();
    expect(mockLandingPage).toHaveBeenCalledWith({ locale: "de" }, undefined);
    expect(
      container.querySelector('script[type="application/ld+json"]'),
    ).toBeTruthy();
  });

  it("returns notFound for unsupported locales", async () => {
    await expect(
      LandingRoute({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("notFound called");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("creates locale-specific landing metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "de" }),
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://www.invessiv.com/de/landing",
    );
    expect(metadata.title).toEqual({
      absolute: "Mehr Anfragen mit einer klaren Landingpage | Invessiv",
    });
    expect(metadata.description).toBe(
      "Landingpages für Selbstständige und kleine Unternehmen – klar, schnell und auf Anfragen optimiert.",
    );
    expect(metadata.openGraph).toMatchObject({
      description:
        "Landingpages für Selbstständige und kleine Unternehmen – klar, schnell und auf Anfragen optimiert.",
      locale: "de_DE",
      siteName: "Invessiv",
      title: "Mehr Anfragen mit einer klaren Landingpage | Invessiv",
      type: "website",
      url: "https://www.invessiv.com/de/landing",
    });
    expect(metadata.openGraph?.images).toEqual([
      {
        alt: "Invessiv Landingpage-Angebot für Selbstständige und kleine Unternehmen",
        height: 630,
        url: "https://www.invessiv.com/og/landing.png",
        width: 1200,
      },
    ]);
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      description:
        "Landingpages für Selbstständige und kleine Unternehmen – klar, schnell und auf Anfragen optimiert.",
      images: [
        {
          alt: "Invessiv Landingpage-Angebot für Selbstständige und kleine Unternehmen",
          url: "https://www.invessiv.com/og/landing.png",
        },
      ],
      title: "Mehr Anfragen mit einer klaren Landingpage | Invessiv",
    });
  });
});
