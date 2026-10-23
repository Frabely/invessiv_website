import { describe, expect, it } from "vitest";

import { SUPPORTED_LOCALES } from "@/config/i18n";
import { getReferencesPageContent } from "./references";

const MAX_STORY_WORDS = 20;

function countWords(text: string) {
  return text.trim().split(/\s+/).length;
}

describe("references dictionary", () => {
  it.each(SUPPORTED_LOCALES)(
    "keeps every %s highlight an exact excerpt of the original quote",
    (locale) => {
      for (const project of getReferencesPageContent(locale).projects) {
        const testimonial = project.testimonial;

        if (testimonial?.highlight) {
          expect(testimonial.quote).toContain(testimonial.highlight);
        }
      }
    },
  );

  it.each(SUPPORTED_LOCALES)(
    "keeps the %s problem, solution and result to one short sentence each",
    (locale) => {
      for (const project of getReferencesPageContent(locale).projects) {
        for (const text of [
          project.problem,
          project.solution,
          project.result,
        ]) {
          expect(countWords(text)).toBeLessThanOrEqual(MAX_STORY_WORDS);
        }
      }
    },
  );

  it("keeps the same projects and shots in every locale", () => {
    const shotKeysByLocale = SUPPORTED_LOCALES.map((locale) =>
      getReferencesPageContent(locale).projects.map((project) => ({
        imageKey: project.imageKey,
        shotKeys: project.shots.map((shot) => shot.shotKey),
      })),
    );

    for (const shotKeys of shotKeysByLocale) {
      expect(shotKeys).toEqual(shotKeysByLocale[0]);
    }
  });
});
