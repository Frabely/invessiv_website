import { describe, expect, it } from "vitest";

import {
  WORKSPACE_SIDEBAR_ITEM_KEY_VALUES,
  WorkspaceSidebarItemKey,
} from "@/common/constants/navigation/workspace-sidebar-item-keys";
import pageDe from "@/i18n/dictionaries/workspace/page/de.json";
import pageEn from "@/i18n/dictionaries/workspace/page/en.json";

describe("WorkspaceSidebarItemKey", () => {
  it("contains the exact keys without duplicates", () => {
    expect(WORKSPACE_SIDEBAR_ITEM_KEY_VALUES).toEqual([
      "overview",
      "leads",
      "crm",
      "settings",
    ]);
    expect([...WORKSPACE_SIDEBAR_ITEM_KEY_VALUES]).toEqual(
      Object.values(WorkspaceSidebarItemKey),
    );
    expect(new Set(WORKSPACE_SIDEBAR_ITEM_KEY_VALUES).size).toBe(
      WORKSPACE_SIDEBAR_ITEM_KEY_VALUES.length,
    );
  });

  it("has a label in every page dictionary", () => {
    for (const items of [
      pageDe.shell.sidebar.items,
      pageEn.shell.sidebar.items,
    ]) {
      expect(Object.keys(items).sort()).toEqual(
        [...WORKSPACE_SIDEBAR_ITEM_KEY_VALUES].sort(),
      );
    }
  });
});
