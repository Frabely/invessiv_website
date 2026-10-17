import { describe, expect, it } from "vitest";
import { PORTAL_HOURS_TAB_VALUES, PortalHoursTab } from "./portal-hours-tabs";

describe("PortalHoursTab", () => {
  it("keeps the tab values and their order stable", () => {
    expect(PortalHoursTab).toEqual({
      Entries: "entries",
      Purchases: "purchases",
    });
    expect(PORTAL_HOURS_TAB_VALUES).toEqual(["entries", "purchases"]);
    expect(new Set(PORTAL_HOURS_TAB_VALUES).size).toBe(
      PORTAL_HOURS_TAB_VALUES.length,
    );
  });
});
