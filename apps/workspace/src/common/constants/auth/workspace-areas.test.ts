import { describe, expect, it } from "vitest";

import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import {
  WORKSPACE_AREA_PERMISSIONS,
  WORKSPACE_AREA_VALUES,
  WorkspaceArea,
} from "@/common/constants/auth/workspace-areas";

describe("WorkspaceArea", () => {
  it("contains the exact areas without duplicates", () => {
    expect(WORKSPACE_AREA_VALUES).toEqual(["dashboard", "leads"]);
    expect(WORKSPACE_AREA_VALUES).toEqual(Object.values(WorkspaceArea));
  });

  it("maps every area to exactly one workspace permission", () => {
    expect(Object.keys(WORKSPACE_AREA_PERMISSIONS).sort()).toEqual(
      [...WORKSPACE_AREA_VALUES].sort(),
    );
    for (const area of WORKSPACE_AREA_VALUES) {
      expect(
        PERMISSION_DEFINITIONS[WORKSPACE_AREA_PERMISSIONS[area]].realm,
      ).toBe(AuthRealm.Workspace);
    }
  });
});
