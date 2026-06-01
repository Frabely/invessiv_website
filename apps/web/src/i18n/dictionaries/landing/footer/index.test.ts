import { describe, expect, it } from "vitest";

import { getLandingFooterContent } from ".";

describe("landing footer dictionary", () => {
  it("returns a description and a navColumn with links for both locales", () => {
    const de = getLandingFooterContent("de");
    const en = getLandingFooterContent("en");

    expect(de.description.length).toBeGreaterThan(0);
    expect(de.navColumn.links.length).toBeGreaterThan(0);
    expect(en.description.length).toBeGreaterThan(0);
    expect(en.navColumn.links.length).toBeGreaterThan(0);
  });

  it("keeps DE and EN nav column link counts aligned", () => {
    const de = getLandingFooterContent("de");
    const en = getLandingFooterContent("en");

    expect(de.navColumn.links).toHaveLength(en.navColumn.links.length);
  });
});
