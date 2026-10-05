import { describe, expect, it } from "vitest";
import { BUTTON_SIZE_VALUES, ButtonSize } from "./button-sizes";

describe("ButtonSize", () => {
  it("contains the exact values without duplicates", () => {
    expect(BUTTON_SIZE_VALUES).toEqual(["default", "control", "icon"]);
    expect([...BUTTON_SIZE_VALUES]).toEqual(Object.values(ButtonSize));
  });
});
