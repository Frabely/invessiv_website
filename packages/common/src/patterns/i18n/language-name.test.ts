import { describe, expect, it } from "vitest";

import {
  languageList,
  languageName,
} from "@invessiv/common/patterns/i18n/language-name";

describe("language names", () => {
  it("names a content locale in the interface language", () => {
    expect(languageName("en", "de")).toBe("Englisch");
    expect(languageName("de", "en")).toBe("German");
  });

  it("joins several missing locales", () => {
    expect(languageList(["de", "en"], "en")).toBe("German & English");
  });
});
