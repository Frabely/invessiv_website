import { describe, expect, it } from "vitest";
import { TextCtaVariant } from "./text-cta-variants";

describe("TextCtaVariant", () => {
  it("contains the exact text-link levels without duplicate values", () => {
    expect(TextCtaVariant).toEqual({
      Tertiary: "tertiary",
      Quaternary: "quaternary",
    });
    const values = Object.values(TextCtaVariant);
    expect(new Set(values).size).toBe(values.length);
  });
});
