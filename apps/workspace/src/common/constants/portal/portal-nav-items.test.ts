import { describe, expect, it } from "vitest";

import { PORTAL_NAV_ITEMS } from "@/common/constants/portal/portal-nav-items";

describe("PORTAL_NAV_ITEMS", () => {
  it("starts empty — every later portal module registers its own entry", () => {
    expect(PORTAL_NAV_ITEMS).toEqual([]);
  });

  it("never registers the same section twice", () => {
    const sections = PORTAL_NAV_ITEMS.map((item) => item.section);
    expect(new Set(sections).size).toBe(sections.length);
  });
});
