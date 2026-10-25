import { describe, expect, it } from "vitest";
import { COLOR_THEME_VALUES, ColorTheme } from "./color-themes";

describe("ColorTheme", () => {
  it("contains the exact values without duplicates", () => {
    expect(COLOR_THEME_VALUES).toEqual(["dark", "light"]);
    expect([...COLOR_THEME_VALUES]).toEqual(Object.values(ColorTheme));
  });
});
