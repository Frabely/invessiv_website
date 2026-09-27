import { describe, expect, it } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PORTAL_NAV_ITEMS } from "@/common/constants/portal/portal-nav-items";
import { PortalSection } from "@/common/constants/portal/portal-sections";

describe("PORTAL_NAV_ITEMS", () => {
  it("registers each live portal module with its read permission", () => {
    expect(PORTAL_NAV_ITEMS).toEqual([
      {
        section: PortalSection.Messages,
        labelKey: PortalSection.Messages,
        requiredPermission: Permission.PortalMessagesRead,
      },
    ]);
  });

  it("never registers the same section twice", () => {
    const sections = PORTAL_NAV_ITEMS.map((item) => item.section);
    expect(new Set(sections).size).toBe(sections.length);
  });
});
