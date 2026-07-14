// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLandingHeroContent } from "@/i18n/dictionaries/landing/hero";
import { CoachingLandingPreview } from "./coaching-landing-preview";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span aria-label={alt} role="img" />,
}));

describe("CoachingLandingPreview", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
  });

  afterEach(cleanup);

  it.each(["de", "en"] as const)(
    "renders the browser, hero, and problem preview for %s",
    (locale) => {
      const content = getLandingHeroContent(locale).preview;
      render(<CoachingLandingPreview content={content} />);

      expect(screen.getByTestId("coaching-preview-browser")).toBeTruthy();
      expect(screen.getByTestId("coaching-preview-hero")).toBeTruthy();
      const problemBlock = screen.getByTestId("coaching-preview-problem-block");
      expect(within(problemBlock).getAllByRole("listitem")).toHaveLength(3);
      const offerBlock = screen.getByTestId("coaching-preview-offer-block");
      expect(within(offerBlock).getAllByRole("listitem")).toHaveLength(3);
      expect(within(offerBlock).getByText(content.offerNote)).toBeTruthy();
      const trustBlock = screen.getByTestId("coaching-preview-trust-block");
      expect(within(trustBlock).getByText(content.quoteAuthor)).toBeTruthy();
      const formBlock = screen.getByTestId("coaching-preview-form-block");
      expect(within(formBlock).getByText(content.formSubmitLabel)).toBeTruthy();
      expect(screen.getByText(content.browserLabel)).toBeTruthy();
      expect(screen.getByRole("img", { name: content.imageAlt })).toBeTruthy();
      expect(screen.queryAllByRole("heading")).toHaveLength(0);
      expect(screen.queryAllByRole("textbox")).toHaveLength(0);
      expect(screen.queryAllByRole("button")).toHaveLength(0);
      expect(screen.queryByRole("link", { name: content.cta })).toBeNull();
      expect(screen.queryByText(/4 (Wochen|weeks)/i)).toBeNull();
      expect(content.quoteAuthor).not.toMatch(/Mara K\./);
    },
  );
});
