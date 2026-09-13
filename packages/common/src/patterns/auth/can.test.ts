import { describe, expect, it } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can, isPermission } from "@invessiv/common/patterns/auth/can";

describe("can", () => {
  it("grants a permission the holder has", () => {
    const holder = { permissions: new Set([Permission.LeadsRead]) };

    expect(can(holder, Permission.LeadsRead)).toBe(true);
  });

  it("denies a permission the holder lacks", () => {
    const holder = { permissions: new Set([Permission.LeadsRead]) };

    expect(can(holder, Permission.LeadsDelete)).toBe(false);
  });

  it("denies everything for an empty permission set", () => {
    expect(can({ permissions: new Set() }, Permission.DashboardRead)).toBe(
      false,
    );
  });
});

describe("isPermission", () => {
  it("accepts every catalog key", () => {
    for (const permission of Object.values(Permission)) {
      expect(isPermission(permission)).toBe(true);
    }
  });

  it("rejects unknown keys and role names", () => {
    expect(isPermission("leads.everything")).toBe(false);
    expect(isPermission("workspace_owner")).toBe(false);
    expect(isPermission("")).toBe(false);
  });
});
