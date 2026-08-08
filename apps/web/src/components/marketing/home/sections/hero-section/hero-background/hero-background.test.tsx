// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HeroBackground } from "./hero-background";

const { useThemeMock } = vi.hoisted(() => ({
  useThemeMock: vi.fn(),
}));

vi.mock("@/components/providers/theme-provider", () => ({
  useTheme: useThemeMock,
}));

function mockTheme(theme: "dark" | "light") {
  useThemeMock.mockReturnValue({
    theme,
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  });
}

function mockViewport(isWide: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: isWide && query === "(min-width: 901px)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

beforeEach(() => {
  mockViewport(true);
});

afterEach(() => {
  cleanup();
  useThemeMock.mockReset();
});

describe("HeroBackground", () => {
  it("renders the video only in dark mode", () => {
    mockTheme("dark");
    const { container } = render(<HeroBackground videoSrc="/spotlight.mp4" />);

    const video = container.querySelector("video");
    expect(video).toBeTruthy();
    expect(video?.muted).toBe(true);
    expect(video?.playsInline).toBe(true);
    expect(video?.getAttribute("preload")).toBe("metadata");
    expect(video?.getAttribute("src")).toBe("/spotlight.mp4");
    expect(container.querySelector("source")).toBeNull();
  });

  it("keeps the video out of the DOM below the desktop breakpoint", () => {
    mockTheme("dark");
    mockViewport(false);
    const { container } = render(<HeroBackground videoSrc="/spotlight.mp4" />);

    expect(container.querySelector("video")).toBeNull();
    expect(container.firstElementChild?.children).toHaveLength(0);
  });

  it("keeps the video out of the DOM in light mode so it is never requested", () => {
    mockTheme("light");
    const { container } = render(<HeroBackground videoSrc="/spotlight.mp4" />);

    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("source")).toBeNull();
  });

  it("falls back to the static layers whenever no video is shown", () => {
    mockTheme("light");
    const { container } = render(<HeroBackground videoSrc="/spotlight.mp4" />);

    expect(container.firstElementChild?.children).toHaveLength(3);
  });

  it("renders the static layers in dark mode without a video source", () => {
    mockTheme("dark");
    const { container } = render(<HeroBackground />);

    expect(container.querySelector("video")).toBeNull();
    expect(container.firstElementChild?.children).toHaveLength(3);
  });
});
