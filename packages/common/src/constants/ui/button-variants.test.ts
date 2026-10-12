import { describe, expect, it } from "vitest";
import { ButtonVariant } from "./button-variants";

describe("ButtonVariant", () => {
  it("contains the exact visual variants without duplicate values", () => {
    expect(ButtonVariant).toEqual({
      Primary: "primary",
      Ghost: "ghost",
      Quiet: "quiet",
      Row: "row",
    });
    const values = Object.values(ButtonVariant);
    expect(new Set(values).size).toBe(values.length);
  });
});
