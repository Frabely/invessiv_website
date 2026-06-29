// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OfferSection } from "./offer-section";

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );

  class MockObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  }

  vi.stubGlobal("IntersectionObserver", MockObserver);
  vi.stubGlobal("ResizeObserver", MockObserver);
});

const content = {
  eyebrow: "Programm",
  title: "Das 8-Wochen Leadership-Coaching",
  description: "Ein fokussiertes 1:1-Programm.",
  includesLabel: "Das ist enthalten",
  includes: ["8 1:1-Sessions", "Standort-Check"],
  suitableLabel: "Für wen",
  suitable: ["Neue Führungskräfte"],
  priceLabel: "Festpreis",
  price: "1.950 €",
  priceCaption: "fürs gesamte Programm",
  ctaLabel: "Erstgespräch buchen",
  priceNote: "Demo-Preis – ein echtes Coaching vereinbaren wir individuell.",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("KlarkompassOfferSection", () => {
  it("renders the heading, legend, price and the mock CTA", () => {
    render(
      <OfferSection
        ctaHref="#kk-contact"
        id="kk-offer"
        locale="de"
        mockLabel="Demo"
        {...content}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Das 8-Wochen Leadership-Coaching",
      }),
    ).toBeTruthy();

    expect(screen.getByText("Das ist enthalten")).toBeTruthy();
    expect(screen.getByText("8 1:1-Sessions")).toBeTruthy();
    expect(screen.getByText("Für wen")).toBeTruthy();
    expect(screen.getByText("Neue Führungskräfte")).toBeTruthy();
    expect(screen.getByText("Festpreis")).toBeTruthy();
    expect(screen.getByText("1.950 €")).toBeTruthy();

    const cta = screen.getByRole("link", { name: /Erstgespräch buchen/ });
    expect(cta.getAttribute("href")).toBe("#kk-contact");
    expect(screen.getByText("Demo")).toBeTruthy();
  });
});
