import { describe, expect, it } from "vitest";
import {
  PORTAL_DASHBOARD_CHAT_OPEN,
  PORTAL_HOURS_ALL_PROJECTS,
  PORTAL_SERVICE_REQUEST_CUSTOM,
  PortalDashboardQueryParam,
} from "./portal-dashboard-query-params";

describe("PortalDashboardQueryParam", () => {
  it("keeps the URL parameter names stable", () => {
    expect(PortalDashboardQueryParam).toEqual({
      Widget: "widget",
      Project: "project",
      Chat: "chat",
      HoursProject: "hoursProject",
      Service: "service",
    });
    expect(PORTAL_DASHBOARD_CHAT_OPEN).toBe("open");
    expect(PORTAL_SERVICE_REQUEST_CUSTOM).toBe("custom");
    expect(PORTAL_HOURS_ALL_PROJECTS).toBe("all");
  });
});
