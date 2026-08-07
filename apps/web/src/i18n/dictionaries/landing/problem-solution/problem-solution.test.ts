import { describe, expect, it } from "vitest";
import { LANDING_PREVIEW_ANCHOR_ORDER } from "@/common/constants/marketing";
import { SUPPORTED_LOCALES } from "@/config/i18n";
import { getLandingProblemSolutionContent } from "./index";

describe("landing problem→solution dictionary", () => {
  it.each(SUPPORTED_LOCALES)("covers every preview anchor in %s", (locale) => {
    const { pairs } = getLandingProblemSolutionContent(locale);

    expect(Object.keys(pairs).sort()).toEqual(
      [...LANDING_PREVIEW_ANCHOR_ORDER].sort(),
    );

    LANDING_PREVIEW_ANCHOR_ORDER.forEach((anchor) => {
      const pair = pairs[anchor];

      expect(pair.problem.trim().length).toBeGreaterThan(0);
      expect(pair.solution.trim().length).toBeGreaterThan(0);
    });
  });
});
