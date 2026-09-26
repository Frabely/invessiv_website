import { describe, expect, it } from "vitest";
import { CustomSelectSize } from "./custom-select-sizes";

describe("CustomSelectSize", () => {
  it("contains the exact sizes without duplicates", () => {
    expect(CustomSelectSize).toEqual({
      Default: "default",
      Compact: "compact",
    });
    expect(new Set(Object.values(CustomSelectSize)).size).toBe(2);
  });
});
