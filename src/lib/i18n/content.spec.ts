import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n/dictionary";

describe("i18n content", () => {
  it("contains non-empty core page content in german", () => {
    const dictionary = getDictionary("de");
    expect(dictionary.pages.home.title.length).toBeGreaterThan(0);
    expect(dictionary.pages.leistungen.title.length).toBeGreaterThan(0);
    expect(dictionary.pages.vorlagen.title.length).toBeGreaterThan(0);
    expect(dictionary.pages.kontakt.title.length).toBeGreaterThan(0);
  });

  it("contains service and template offers in english", () => {
    const dictionary = getDictionary("en");
    expect(dictionary.offers.servicePackages.length).toBeGreaterThan(0);
    expect(dictionary.offers.templateProducts.length).toBeGreaterThan(0);
  });
});
