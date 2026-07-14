import { describe, expect, it } from "vitest";
import de from "./de.json";
import en from "./en.json";

describe("landing hero dictionaries", () => {
  it("keeps the coaching preview structurally aligned in German and English", () => {
    expect(Object.keys(en.preview)).toEqual(Object.keys(de.preview));
    expect(en.preview.problems).toHaveLength(3);
    expect(de.preview.problems).toHaveLength(3);
  });
});
