// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KlarkompassSpine } from "@/references/klarkompass-coaching/components/klarkompass-spine/klarkompass-spine";
import { Reveal, RevealGroup } from "./klarkompass-reveal";

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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("KlarkompassReveal", () => {
  it("renders grouped reveal items as the requested elements", () => {
    render(
      <RevealGroup as="section" aria-label="group">
        <Reveal as="div">Intro</Reveal>
        <ul>
          <Reveal as="li">Item</Reveal>
        </ul>
      </RevealGroup>,
    );

    expect(screen.getByText("Intro")).toBeDefined();
    expect(screen.getByText("Item").tagName).toBe("LI");
  });

  it("renders the bearing-line spine without throwing", () => {
    const { container } = render(<KlarkompassSpine />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
