import { describe, expect, it } from "vitest";

import { isHexColor } from "@invessiv/common/patterns/validation/is-hex-color";

describe("isHexColor", () => {
  it("accepts six-digit hex colours in either case", () => {
    expect(isHexColor("#1A2B3C")).toBe(true);
    expect(isHexColor("#ffffff")).toBe(true);
  });

  it("rejects short, unprefixed and padded values", () => {
    expect(isHexColor("#fff")).toBe(false);
    expect(isHexColor("1A2B3C")).toBe(false);
    expect(isHexColor(" #1A2B3C")).toBe(false);
    expect(isHexColor("#1A2B3G")).toBe(false);
  });
});
