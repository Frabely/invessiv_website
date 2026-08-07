// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingPreviewAnchor } from "@/common/constants/marketing";
import { getLandingHeroContent } from "@/i18n/dictionaries/landing/hero";
import { CoachingLandingPreview } from "./coaching-landing-preview";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span aria-label={alt} role="img" />,
}));

function renderPreview({
  activeAnchor = null,
  locale = "de",
}: {
  activeAnchor?: LandingPreviewAnchor | null;
  locale?: "de" | "en";
} = {}) {
  const content = getLandingHeroContent(locale).preview;

  render(
    <CoachingLandingPreview activeAnchor={activeAnchor} content={content} />,
  );

  return { content };
}

describe("CoachingLandingPreview", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      })),
    });
  });

  afterEach(cleanup);

  it.each(["de", "en"] as const)(
    "renders the solved demo page exactly once for %s",
    (locale) => {
      const { content } = renderPreview({ locale });

      expect(screen.getByTestId("coaching-preview-browser")).toBeTruthy();
      expect(screen.getAllByTestId("coaching-preview-hero")).toHaveLength(1);
      expect(screen.getAllByTestId("coaching-preview-form-block")).toHaveLength(
        1,
      );

      expect(screen.getByText(content.title)).toBeTruthy();
      expect(screen.getByText(content.kicker)).toBeTruthy();
      expect(screen.getByTestId("coaching-preview-cta").textContent).toBe(
        content.cta,
      );
      expect(screen.getByText(content.quoteAuthor)).toBeTruthy();
      expect(screen.queryByText(/4 (Wochen|weeks)/i)).toBeNull();
    },
  );

  it("gives every anchor exactly one target for the ring", () => {
    renderPreview();

    Object.values(LandingPreviewAnchor).forEach((anchor) => {
      expect(
        document.querySelectorAll(`[data-preview-anchor="${anchor}"]`),
      ).toHaveLength(1);
    });
  });

  it("hides the highlight until an anchor is active", () => {
    renderPreview();

    expect(
      screen.getByTestId("coaching-preview-highlight-overlay").dataset.active,
    ).toBe("false");
  });

  it("shows the highlight for the active anchor", () => {
    renderPreview({ activeAnchor: LandingPreviewAnchor.Headline });

    expect(
      screen.getByTestId("coaching-preview-highlight-overlay").dataset.active,
    ).toBe("true");
  });

  it("stays decorative — the demo carries no controls", () => {
    const { content } = renderPreview();

    expect(screen.getByLabelText(content.ariaLabel)).toBeTruthy();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
  });
});
