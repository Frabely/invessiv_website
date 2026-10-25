import { describe, expect, it } from "vitest";
import { BrandLogo } from "./brand-logo";

describe("BrandLogo", () => {
  it("points at the header mark with its intrinsic size", () => {
    expect(BrandLogo).toEqual({
      src: "/brand/invessiv-logo-mehr-abstand.svg",
      width: 1562,
      height: 1333,
    });
  });
});
