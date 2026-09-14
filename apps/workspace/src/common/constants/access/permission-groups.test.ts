import { describe, expect, it } from "vitest";

import { WORKSPACE_PERMISSION_VALUES } from "@invessiv/common/constants/auth/permission-definitions";
import {
  PERMISSION_GROUP_PERMISSIONS,
  PERMISSION_GROUP_VALUES,
  PermissionGroup,
} from "@/common/constants/access/permission-groups";
import {
  SETTINGS_TAB_VALUES,
  SettingsTab,
} from "@/common/constants/access/settings-tabs";

describe("PERMISSION_GROUP_PERMISSIONS", () => {
  it("lists every group of the const object without duplicates", () => {
    expect(PERMISSION_GROUP_VALUES).toEqual(Object.values(PermissionGroup));
    expect(Object.keys(PERMISSION_GROUP_PERMISSIONS)).toEqual([
      ...PERMISSION_GROUP_VALUES,
    ]);
  });

  it("places every workspace permission in exactly one group", () => {
    const grouped = PERMISSION_GROUP_VALUES.flatMap(
      (group) => PERMISSION_GROUP_PERMISSIONS[group],
    );

    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual(
      [...WORKSPACE_PERMISSION_VALUES].sort(),
    );
  });
});

describe("SettingsTab", () => {
  it("contains the exact tabs without duplicates", () => {
    expect(SETTINGS_TAB_VALUES).toEqual(["members", "roles"]);
    expect(SETTINGS_TAB_VALUES).toEqual(Object.values(SettingsTab));
  });
});
