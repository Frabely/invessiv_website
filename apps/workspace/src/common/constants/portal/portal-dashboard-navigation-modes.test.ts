import { describe, expect, it } from "vitest";
import { PortalDashboardNavigationMode } from "./portal-dashboard-navigation-modes";

describe("PortalDashboardNavigationMode", () => {
  it("defines the two supported history operations without duplicates", () => {
    const modes = Object.values(PortalDashboardNavigationMode);
    expect(modes).toEqual(["push", "replace"]);
    expect(new Set(modes).size).toBe(modes.length);
  });
});
