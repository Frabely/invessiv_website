import { describe, expect, it } from "vitest";

import {
  PORTAL_SECTION_VALUES,
  PortalSection,
} from "@/common/constants/portal/portal-sections";

describe("PortalSection", () => {
  it("contains the exact section slugs without duplicates", () => {
    expect(PORTAL_SECTION_VALUES).toEqual([
      "projects",
      "files",
      "assets",
      "messages",
      "onboarding",
      "services",
    ]);
    expect([...PORTAL_SECTION_VALUES]).toEqual(Object.values(PortalSection));
    expect(new Set(PORTAL_SECTION_VALUES).size).toBe(
      PORTAL_SECTION_VALUES.length,
    );
  });
});
