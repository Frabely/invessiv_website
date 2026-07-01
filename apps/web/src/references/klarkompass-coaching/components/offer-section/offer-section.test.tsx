// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  vi.stubGlobal("alert", vi.fn());
});

const content = {
  eyebrow: "Programm",
  title: "Das 8-Wochen Leadership-Coaching",
  includesLabel: "Das ist enthalten",
  includes: ["8 1:1-Sessions", "Standort-Check"],
  suitableLabel: "Für wen",
  suitable: ["Neue Führungskräfte"],
  priceLabel: "Beispielpreis",
  price: "1.950 €",
  priceCaption: "als Platzhalter für dieses Seitenkonzept",
  ctaLabel: "Erstgespräch buchen",
  priceNote: "Dieser Preis gehört zum Beispielprojekt.",
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
        mockAlertMessage="Demo alert"
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
    expect(screen.getByText("Beispielpreis")).toBeTruthy();
    expect(screen.getByText("1.950 €")).toBeTruthy();

    const cta = screen.getByRole("link", { name: /Erstgespräch buchen/ });
    expect(cta.getAttribute("href")).toBe("#kk-contact");

    fireEvent.click(cta);
    expect(window.alert).toHaveBeenCalledWith("Demo alert");
  });
});
