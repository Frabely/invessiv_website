import { describe, expect, it } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalSection } from "@/common/constants/portal/portal-sections";
import type { PortalNavItem } from "@/common/constants/portal/portal-nav-items";
import { listPermittedPortalNavItems } from "./list-permitted-portal-nav-items";

const PROJECTS_ITEM: PortalNavItem = {
  section: PortalSection.Projects,
  labelKey: "projects",
  requiredPermission: Permission.PortalAccess,
};
const FILES_ITEM: PortalNavItem = {
  section: PortalSection.Files,
  labelKey: "files",
  requiredPermission: Permission.PortalAccessManage,
};

describe("listPermittedPortalNavItems", () => {
  it("keeps only items whose required permission the actor holds", () => {
    const result = listPermittedPortalNavItems(
      new Set([Permission.PortalAccess]),
      [PROJECTS_ITEM, FILES_ITEM],
    );

    expect(result).toEqual([PROJECTS_ITEM]);
  });

  it("returns an empty list, never a falsy value, when nothing matches", () => {
    const result = listPermittedPortalNavItems(new Set(), [PROJECTS_ITEM]);

    expect(result).toEqual([]);
  });

  it("defaults to the live PORTAL_NAV_ITEMS registry", () => {
    expect(
      listPermittedPortalNavItems(new Set([Permission.PortalAccess])),
    ).toEqual([]);
  });
});
