// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeroZoomPlaceholder } from "./hero-zoom-placeholder";

vi.mock("@/components/marketing/hero-visual/hero-visual", () => ({
  HeroVisual: ({ ariaLabel }: { ariaLabel: string }) => (
    <div aria-label={ariaLabel} data-testid="hero-visual-fallback" />
  ),
}));

describe("HeroZoomPlaceholder", () => {
  afterEach(() => {
    cleanup();
  });

  it("marks the measurement target and wraps the fallback visual", () => {
    const { container } = render(
      <HeroZoomPlaceholder ariaLabel="Hero visual preview" />,
    );

    const placeholder = container.querySelector("[data-hero-zoom-placeholder]");
    const fallback = container.querySelector(
      "[data-hero-zoom-placeholder-fallback]",
    );

    expect(placeholder).toBeTruthy();
    expect(fallback).toBeTruthy();
    expect(placeholder?.contains(fallback)).toBe(true);
    expect(
      screen.getByTestId("hero-visual-fallback").getAttribute("aria-label"),
    ).toBe("Hero visual preview");
  });
});
