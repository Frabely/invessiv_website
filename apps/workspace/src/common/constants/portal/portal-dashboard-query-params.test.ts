import { describe, expect, it } from "vitest";
import { PortalDashboardQueryParam } from "./portal-dashboard-query-params";

describe("PortalDashboardQueryParam", () => {
  it("keeps the URL parameter names stable", () => {
    expect(PortalDashboardQueryParam).toEqual({
      Widget: "widget",
      Project: "project",
    });
  });
});
