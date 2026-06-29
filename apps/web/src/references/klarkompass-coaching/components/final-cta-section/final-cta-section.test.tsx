// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FinalCtaSection } from "./final-cta-section";

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
  bearing: {
    readout: "000°",
    caption: "Kurs erreicht: Klarheit",
  },
  title: "Setz den Kurs. Wir gehen ihn gemeinsam.",
  description: "Im kostenlosen Erstgespräch klären wir deine Ausgangslage.",
  ctaLabel: "Kostenloses Erstgespräch buchen",
  mockNote: "Hinweis: Dies ist ein Beispielprojekt.",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("KlarkompassFinalCtaSection", () => {
  it("renders the heading, bearing readout, note and the mock CTA", () => {
    render(
      <FinalCtaSection
        id="kk-contact"
        locale="de"
        mockAlertMessage="Demo alert"
        {...content}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Setz den Kurs. Wir gehen ihn gemeinsam.",
      }),
    ).toBeTruthy();

    expect(screen.getByText("000°")).toBeTruthy();
    expect(screen.getByText("Kurs erreicht: Klarheit")).toBeTruthy();
    expect(
      screen.getByText(
        "Im kostenlosen Erstgespräch klären wir deine Ausgangslage.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Hinweis: Dies ist ein Beispielprojekt."),
    ).toBeTruthy();

    const cta = screen.getByRole("link", {
      name: /Kostenloses Erstgespräch buchen/,
    });
    expect(cta.getAttribute("href")).toBe("#kk-contact");

    fireEvent.click(cta);
    expect(window.alert).toHaveBeenCalledWith("Demo alert");
  });
});
