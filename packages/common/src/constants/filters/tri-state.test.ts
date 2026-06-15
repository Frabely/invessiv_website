import { describe, expect, it } from "vitest";
import { TriState } from "./tri-state";

describe("TriState", () => {
  it("exposes the expected values", () => {
    expect(TriState).toEqual({
      Off: "off",
      Include: "include",
      Exclude: "exclude",
    });
  });

  it("has no duplicate values", () => {
    const values = Object.values(TriState);
    expect(new Set(values).size).toBe(values.length);
  });
});
