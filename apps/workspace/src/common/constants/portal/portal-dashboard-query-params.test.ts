import { describe, expect, it } from "vitest";
import {
  PORTAL_DASHBOARD_CHAT_OPEN,
  PortalDashboardQueryParam,
} from "./portal-dashboard-query-params";

describe("PortalDashboardQueryParam", () => {
  it("keeps the URL parameter names stable", () => {
    expect(PortalDashboardQueryParam).toEqual({
      Widget: "widget",
      Project: "project",
      Chat: "chat",
    });
    expect(PORTAL_DASHBOARD_CHAT_OPEN).toBe("open");
  });
});
