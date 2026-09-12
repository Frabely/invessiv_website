import { describe, expect, it } from "vitest";
import {
  WORKSPACE_ROLE_VALUES,
  WorkspaceRole,
} from "@invessiv/common/constants/crm/workspace-roles";

describe("WORKSPACE_ROLE_VALUES", () => {
  it("contains exactly the values of the const object", () => {
    expect([...WORKSPACE_ROLE_VALUES]).toEqual(Object.values(WorkspaceRole));
  });

  it("contains no duplicates", () => {
    expect(new Set(WORKSPACE_ROLE_VALUES).size).toBe(
      WORKSPACE_ROLE_VALUES.length,
    );
  });

  it("has no admin role", () => {
    expect(WORKSPACE_ROLE_VALUES).not.toContain("admin");
    expect([...WORKSPACE_ROLE_VALUES]).toEqual(["owner", "member"]);
  });
});
