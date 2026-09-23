import { describe, expect, it } from "vitest";

import {
  FACET_FILTER_DISPLAY_VALUES,
  FacetFilterDisplay,
} from "@/common/constants/ui/facet-filter-displays";

describe("FacetFilterDisplay", () => {
  it("contains the exact displays without duplicates", () => {
    expect(FACET_FILTER_DISPLAY_VALUES).toEqual(["chips", "select"]);
    expect([...FACET_FILTER_DISPLAY_VALUES]).toEqual(
      Object.values(FacetFilterDisplay),
    );
    expect(new Set(FACET_FILTER_DISPLAY_VALUES).size).toBe(
      FACET_FILTER_DISPLAY_VALUES.length,
    );
  });
});
