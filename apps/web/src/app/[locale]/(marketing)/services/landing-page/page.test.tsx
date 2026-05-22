// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LandingRoute, { generateMetadata } from "./page";

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
      "https://invessiv.com/de/services/landing-page",
    );
    expect(metadata.title).toEqual({
      absolute: "Landingpage erstellen lassen | ab 999 € | Invessiv",
    });
    expect(metadata.description).toBe(
      "Schnelle, klare Landingpages für Dienstleister und KMU – ab 999 €, in 5–10 Tagen. Struktur, Design und Technik aus einer Hand. Kostenlosen Check anfragen.",
    );
    expect(metadata.openGraph).toMatchObject({
      description:
        "Schnelle, klare Landingpages für Dienstleister und KMU – ab 999 €, in 5–10 Tagen. Struktur, Design und Technik aus einer Hand. Kostenlosen Check anfragen.",
      locale: "de_DE",
      siteName: "Invessiv",
      title: "Landingpage erstellen lassen | ab 999 € | Invessiv",
      type: "website",
      url: "https://invessiv.com/de/services/landing-page",
    });
    expect(metadata.openGraph?.images).toEqual([
      {
        alt: "Invessiv Landingpage-Angebot für Selbstständige und kleine Unternehmen",
        height: 630,
        url: "https://invessiv.com/og/landing.png",
        width: 1200,
      },
    ]);
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      description:
        "Schnelle, klare Landingpages für Dienstleister und KMU – ab 999 €, in 5–10 Tagen. Struktur, Design und Technik aus einer Hand. Kostenlosen Check anfragen.",
      images: [
        {
          alt: "Invessiv Landingpage-Angebot für Selbstständige und kleine Unternehmen",
          url: "https://invessiv.com/og/landing.png",
        },
      ],
      title: "Landingpage erstellen lassen | ab 999 € | Invessiv",
    });
  });
});
