import { describe, expect, it } from "vitest";
import { resolveLocale } from "@/lib/i18n/locale";

describe("resolveLocale", () => {
  it("returns default locale for undefined input", () => {
    expect(resolveLocale(undefined)).toBe("de");
  });

  it("returns normalized locale for supported values", () => {
    expect(resolveLocale("EN")).toBe("en");
    expect(resolveLocale("de")).toBe("de");
  });

  it("falls back to default locale for unsupported values", () => {
    expect(resolveLocale("fr")).toBe("de");
  });
});
