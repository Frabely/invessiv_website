import { describe, expect, it } from "vitest";
import { PortalHoursApiPath } from "./portal-hours-api-paths";
import { PortalHoursQueryParam } from "./portal-hours-query-params";

describe("portal hours constants", () => {
  it("keeps the route segments stable", () => {
    expect(PortalHoursApiPath).toEqual({ Hours: "hours", Entries: "entries" });
  });

  it("keeps the list query parameter names stable", () => {
    expect(PortalHoursQueryParam).toEqual({
      ProjectId: "projectId",
      Cursor: "cursor",
    });
  });
});
