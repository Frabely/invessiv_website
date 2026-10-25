import { describe, expect, it } from "vitest";
import { TextCtaElement } from "./text-cta-elements";

describe("TextCtaElement", () => {
  it("contains the exact renderable elements without duplicate values", () => {
    expect(TextCtaElement).toEqual({
      Anchor: "a",
      Button: "button",
      Summary: "summary",
    });
    const values = Object.values(TextCtaElement);
    expect(new Set(values).size).toBe(values.length);
  });
});
