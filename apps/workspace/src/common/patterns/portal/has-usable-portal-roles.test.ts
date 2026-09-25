import { describe, expect, it } from "vitest";
import { hasUsablePortalRoles } from "./has-usable-portal-roles";

describe("hasUsablePortalRoles", () => {
  it("requires every selected role and portal access", () => {
    const rows = [
      { id: "role-a", permission: "portal.access" },
      { id: "role-a", permission: "portal.files.read" },
      { id: "role-b", permission: null },
    ];
    expect(hasUsablePortalRoles(["role-a", "role-b"], rows)).toBe(true);
    expect(hasUsablePortalRoles(["role-a", "role-c"], rows)).toBe(false);
    expect(hasUsablePortalRoles([], rows)).toBe(false);
    expect(hasUsablePortalRoles(["role-b"], rows)).toBe(false);
  });
});
