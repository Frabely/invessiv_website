import { describe, expect, it } from "vitest";
import { DialogSize } from "./dialog-sizes";

describe("DialogSize", () => {
  it("contains the exact sizes without duplicates", () => {
    expect(DialogSize).toEqual({
      Narrow: "narrow",
      Wide: "wide",
      Full: "full",
    });
    expect(new Set(Object.values(DialogSize)).size).toBe(3);
  });
});
