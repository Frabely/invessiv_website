// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FaqSection } from "./faq-section";

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
  eyebrow: "FAQ",
  title: "Häufige Fragen",
  lead: "Kurz und ehrlich beantwortet.",
  contactPrompt: "Noch eine Frage offen?",
  items: [
    { question: "Frage 1", answer: "Antwort 1" },
    { question: "Frage 2", answer: "Antwort 2" },
  ],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("KlarkompassFaqSection", () => {
  it("opens one item at a time and toggles it closed again", () => {
    render(
      <FaqSection
        ctaHref="#kk-contact"
        ctaLabel="Erstgespräch buchen"
        id="kk-faq"
        locale="de"
        mockLabel="Demo"
        {...content}
      />,
    );

    const first = screen.getByRole("button", { name: "Frage 1" });
    const second = screen.getByRole("button", { name: "Frage 2" });

    expect(first.getAttribute("aria-expanded")).toBe("true");
    expect(second.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(second);
    expect(first.getAttribute("aria-expanded")).toBe("false");
    expect(second.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(second);
    expect(second.getAttribute("aria-expanded")).toBe("false");
  });
});
