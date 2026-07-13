import { describe, expect, it } from "vitest";

import { SiteHeaderAsset } from "./site-header-assets";
import { SiteHeaderDomSelector } from "./site-header-dom-selectors";

describe("site header constants", () => {
  it("keeps asset paths and DOM selectors stable and unique", () => {
    expect(SiteHeaderAsset).toEqual({
      BrandIcon: "/brand/icon.png",
    });
    expect(SiteHeaderDomSelector).toEqual({
      Inner: "[data-site-header-inner]",
      Root: "[data-site-header]",
    });

    const values = [
      ...Object.values(SiteHeaderAsset),
      ...Object.values(SiteHeaderDomSelector),
    ];

    expect(new Set(values).size).toBe(values.length);
  });
});
