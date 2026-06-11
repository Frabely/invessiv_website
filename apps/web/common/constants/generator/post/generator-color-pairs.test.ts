import { describe, expect, it } from "vitest";

import {
  GENERATOR_COLOR_AUTO,
  GENERATOR_COLOR_PAIRS,
} from "@/common/constants";

describe("generator color pairs", () => {
  it("exposes the ten predefined pairs", () => {
    expect(GENERATOR_COLOR_PAIRS).toHaveLength(10);
  });

  it("has unique ids", () => {
    const ids = GENERATOR_COLOR_PAIRS.map((pair) => pair.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses 6-digit hex for every color channel", () => {
    const hex = /^#[0-9A-Fa-f]{6}$/;
    for (const pair of GENERATOR_COLOR_PAIRS) {
      expect(pair.primary).toMatch(hex);
      expect(pair.secondary).toMatch(hex);
      expect(pair.accent).toMatch(hex);
      expect(pair.text).toMatch(hex);
    }
  });

  it("keeps the auto sentinel distinct from any pair id", () => {
    const ids: string[] = GENERATOR_COLOR_PAIRS.map((pair) => pair.id);
    expect(ids).not.toContain(GENERATOR_COLOR_AUTO);
  });
});
