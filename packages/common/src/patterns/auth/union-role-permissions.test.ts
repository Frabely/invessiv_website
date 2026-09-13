import { describe, expect, it } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { unionRolePermissions } from "@invessiv/common/patterns/auth/union-role-permissions";

const ROLES = [
  {
    id: "role-sales",
    active: true,
    permissions: [Permission.LeadsWrite, Permission.LeadsRead],
  },
  {
    id: "role-support",
    active: true,
    permissions: [Permission.CustomersRead, Permission.LeadsRead],
  },
  {
    id: "role-disabled",
    active: false,
    permissions: [Permission.LeadsDelete],
  },
];

describe("unionRolePermissions", () => {
  it("returns the union of the selected active roles in catalog order without duplicates", () => {
    expect(unionRolePermissions(ROLES, ["role-support", "role-sales"])).toEqual(
      [Permission.LeadsRead, Permission.LeadsWrite, Permission.CustomersRead],
    );
  });

  it("ignores inactive roles like the server does", () => {
    expect(unionRolePermissions(ROLES, ["role-disabled"])).toEqual([]);
  });

  it("ignores unknown role ids and returns nothing for an empty selection", () => {
    expect(unionRolePermissions(ROLES, ["role-unknown"])).toEqual([]);
    expect(unionRolePermissions(ROLES, [])).toEqual([]);
  });
});
