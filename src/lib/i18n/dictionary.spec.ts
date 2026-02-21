import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n/dictionary";

describe("getDictionary", () => {
  it("returns localized navigation labels for german", () => {
    const dictionary = getDictionary("de");
    expect(dictionary.navigation.main[0].label).toBe("Start");
  });

  it("returns localized navigation labels for english", () => {
    const dictionary = getDictionary("en");
    expect(dictionary.navigation.main[0].label).toBe("Home");
  });
});
