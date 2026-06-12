import { describe, expect, it } from "vitest";

import { getLandingSuccessContent } from ".";

describe("landing success dictionary", () => {
  it("returns meta and page content for both locales", () => {
    const de = getLandingSuccessContent("de");
    const en = getLandingSuccessContent("en");

    expect(de.meta.title.endsWith("| Invessiv")).toBe(true);
    expect(en.meta.title.endsWith("| Invessiv")).toBe(true);
    expect(de.meta.description.length).toBeGreaterThan(0);
    expect(en.meta.description.length).toBeGreaterThan(0);
    expect(de.page.title.length).toBeGreaterThan(0);
    expect(en.page.title.length).toBeGreaterThan(0);
  });

  it("keeps DE and EN next-step counts aligned", () => {
    const de = getLandingSuccessContent("de");
    const en = getLandingSuccessContent("en");

    expect(de.page.steps).toHaveLength(en.page.steps.length);
  });
});
