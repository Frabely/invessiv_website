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
    render(
      await LandingRoute({
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(screen.getByTestId("landing-page")).toBeTruthy();
    expect(mockLandingPage).toHaveBeenCalledWith({ locale: "de" }, undefined);
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
    expect(metadata.title).toBe("Landingpages für mehr passende Anfragen");
    expect(metadata.description).toContain("Fokussierte Landingpages");
  });
});
