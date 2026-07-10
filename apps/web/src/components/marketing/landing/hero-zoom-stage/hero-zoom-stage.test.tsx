// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HERO_ZOOM_CHROME_ATTRIBUTE,
  HERO_ZOOM_STATE,
} from "@/common/constants/marketing";

import { HeroZoomStage } from "./hero-zoom-stage";

function renderStage() {
  return render(
    <HeroZoomStage
      heroSlot={
        <div data-testid="hero-slot">
          <div data-hero-zoom-placeholder="" data-testid="placeholder" />
        </div>
      }
      frameSlot={
        <div data-testid="frame-slot">
          <div data-hero-zoom-replica="" data-testid="replica" />
          <section id="solution" data-testid="solution" />
          <section id="process" />
        </div>
      }
    />,
  );
}

function getStage() {
  const stage = document.querySelector("[data-zoom-state]");
  if (!(stage instanceof HTMLElement)) {
    throw new Error("Expected the zoom stage to be rendered");
  }

  return stage;
}

function getFrame() {
  const frame = screen.getByTestId("frame-slot").parentElement;
  if (!(frame instanceof HTMLElement)) {
    throw new Error("Expected the zoom frame to be rendered");
  }

  return frame;
}

function getHeroPin() {
  const heroPin = screen.getByTestId("hero-slot").parentElement;
  if (!(heroPin instanceof HTMLElement)) {
    throw new Error("Expected the hero pin to be rendered");
  }

  return heroPin;
}

function mockDesktopViewport() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query !== "(max-width: 900px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 900,
  });
}

function mockMobileViewport() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 640,
  });
}

function mockMeasurements() {
  const frame = getFrame();
  const placeholder = screen.getByTestId("placeholder");
  const solution = screen.getByTestId("solution");

  Object.defineProperty(frame, "offsetTop", {
    configurable: true,
    value: 1300,
  });
  Object.defineProperty(frame, "offsetLeft", { configurable: true, value: 0 });
  Object.defineProperty(frame, "offsetWidth", {
    configurable: true,
    value: 1440,
  });
  Object.defineProperty(frame, "offsetHeight", {
    configurable: true,
    value: 9800,
  });
  Object.defineProperty(frame, "offsetParent", {
    configurable: true,
    value: null,
  });
  Object.defineProperty(solution, "offsetTop", {
    configurable: true,
    value: 2100,
  });
  Object.defineProperty(solution, "offsetParent", {
    configurable: true,
    value: frame,
  });
  vi.spyOn(placeholder, "getBoundingClientRect").mockReturnValue({
    top: 220,
    left: 860,
    right: 1292,
    bottom: 520,
    width: 432,
    height: 300,
    x: 860,
    y: 220,
    toJSON: () => ({}),
  });
}

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value,
  });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("HeroZoomStage", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/de/services/landing-page");
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders both slots and settles to idle without a desktop pointer", async () => {
    renderStage();

    expect(screen.getByTestId("hero-slot")).toBeTruthy();
    expect(screen.getByTestId("frame-slot")).toBeTruthy();

    await waitFor(() => {
      expect(getStage().getAttribute("data-zoom-state")).toBe(
        HERO_ZOOM_STATE.Idle,
      );
    });
    expect(getFrame().hasAttribute("inert")).toBe(false);
  });

  it("renders the decorative browser chrome overlay", () => {
    renderStage();

    const chrome = getStage().querySelector(`[${HERO_ZOOM_CHROME_ATTRIBUTE}]`);
    expect(chrome).not.toBeNull();
    expect(chrome?.getAttribute("aria-hidden")).toBe("true");
  });

  it("settles to idle when the layout cannot be measured", async () => {
    mockDesktopViewport();
    renderStage();

    await waitFor(() => {
      expect(getStage().getAttribute("data-zoom-state")).toBe(
        HERO_ZOOM_STATE.Idle,
      );
    });
  });

  it("settles to idle when a hash deep link is present", async () => {
    mockDesktopViewport();
    window.history.replaceState({}, "", "/de/services/landing-page#pricing");
    renderStage();
    mockMeasurements();

    await waitFor(() => {
      expect(getStage().getAttribute("data-zoom-state")).toBe(
        HERO_ZOOM_STATE.Idle,
      );
    });
  });

  it("pins the frame on desktop, hands off to native scroll and reverses", async () => {
    mockDesktopViewport();
    renderStage();
    mockMeasurements();

    const frame = getFrame();
    const heroPin = getHeroPin();

    await waitFor(() => {
      expect(getStage().getAttribute("data-zoom-state")).toBe(
        HERO_ZOOM_STATE.Pinned,
      );
    });
    expect(frame.style.transform).toContain("scale");
    expect(frame.hasAttribute("inert")).toBe(true);
    expect(getStage().style.getPropertyValue("--hero-zoom-chrome-w")).toMatch(
      /px$/,
    );
    expect(
      getStage().style.getPropertyValue("--hero-zoom-chrome-opacity"),
    ).toBe("1");

    setScrollY(3400);

    await waitFor(() => {
      expect(getStage().getAttribute("data-zoom-state")).toBe(
        HERO_ZOOM_STATE.Native,
      );
    });
    expect(frame.style.transform).toBe("");
    expect(frame.style.clipPath).toBe("");
    expect(frame.style.willChange).toBe("");
    expect(frame.hasAttribute("inert")).toBe(false);
    expect(heroPin.style.visibility).toBe("hidden");
    expect(getStage().style.getPropertyValue("--hero-zoom-chrome-w")).toBe("");
    expect(
      getStage().style.getPropertyValue("--hero-zoom-chrome-opacity"),
    ).toBe("");

    setScrollY(400);

    await waitFor(() => {
      expect(getStage().getAttribute("data-zoom-state")).toBe(
        HERO_ZOOM_STATE.Pinned,
      );
    });
    expect(frame.style.transform).toContain("scale");
    expect(frame.hasAttribute("inert")).toBe(true);
    expect(heroPin.style.visibility).not.toBe("hidden");
  });

  it("pins the frame on mobile when reduced motion is not requested", async () => {
    mockMobileViewport();
    renderStage();
    mockMeasurements();

    await waitFor(() => {
      expect(getStage().getAttribute("data-zoom-state")).toBe(
        HERO_ZOOM_STATE.Pinned,
      );
    });

    expect(getFrame().style.transform).toContain("scale");
  });
});
