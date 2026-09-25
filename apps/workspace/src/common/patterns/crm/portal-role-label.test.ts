import { describe, expect, it } from "vitest";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { portalRoleLabel } from "./portal-role-label";

describe("portalRoleLabel", () => {
  it("localizes the standard role and keeps custom role names", () => {
    expect(
      portalRoleLabel(
        { name: "Stored name", systemKey: SystemRoleKey.PortalStandard },
        "Portal-Standard",
      ),
    ).toBe("Portal-Standard");
    expect(
      portalRoleLabel({ name: "Custom", systemKey: null }, "Portal-Standard"),
    ).toBe("Custom");
  });
});
