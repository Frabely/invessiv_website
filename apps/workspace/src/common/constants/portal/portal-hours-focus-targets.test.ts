import { describe, expect, it } from "vitest";
import { PortalHoursFocusTarget } from "./portal-hours-focus-targets";

describe("PortalHoursFocusTarget", () => {
  it("defines distinct project and overview targets", () => {
    expect(PortalHoursFocusTarget).toEqual({
      Project: "project",
      Overview: "overview",
    });
    const values = Object.values(PortalHoursFocusTarget);
    expect(new Set(values).size).toBe(values.length);
  });
});
