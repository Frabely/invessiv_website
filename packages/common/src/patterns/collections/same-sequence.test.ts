import { describe, expect, it } from "vitest";
import { sameSequence } from "./same-sequence";

describe("sameSequence", () => {
  it("accepts equal values in equal order, empty lists included", () => {
    expect(sameSequence(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameSequence([], [])).toBe(true);
  });

  it("rejects another order, another length or another value", () => {
    expect(sameSequence(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameSequence(["a"], ["a", "b"])).toBe(false);
    expect(sameSequence(["a", "b"], ["a", "c"])).toBe(false);
  });
});
