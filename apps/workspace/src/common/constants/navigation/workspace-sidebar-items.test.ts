import { describe, expect, it } from "vitest";

import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { WorkspaceSidebarItemKey } from "@/common/constants/navigation/workspace-sidebar-item-keys";
import { WORKSPACE_SIDEBAR_ITEMS } from "@/common/constants/navigation/workspace-sidebar-items";

describe("WORKSPACE_SIDEBAR_ITEMS", () => {
  it("contains every sidebar destination exactly once", () => {
    expect(WORKSPACE_SIDEBAR_ITEMS).toEqual([
      {
        area: WorkspaceArea.Dashboard,
        id: WorkspaceSidebarItemKey.Overview,
        labelKey: WorkspaceSidebarItemKey.Overview,
      },
      {
        area: WorkspaceArea.Leads,
        id: WorkspaceSidebarItemKey.Leads,
        labelKey: WorkspaceSidebarItemKey.Leads,
      },
      {
        area: WorkspaceArea.Crm,
        id: WorkspaceSidebarItemKey.Crm,
        labelKey: WorkspaceSidebarItemKey.Crm,
      },
      {
        area: WorkspaceArea.Settings,
        id: WorkspaceSidebarItemKey.Settings,
        labelKey: WorkspaceSidebarItemKey.Settings,
      },
    ]);

    const ids = WORKSPACE_SIDEBAR_ITEMS.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
