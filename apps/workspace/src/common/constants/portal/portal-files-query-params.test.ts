import { describe, expect, it } from "vitest";
import { DASHBOARD_FILES_PREVIEW_SIZE } from "./portal-files-limits";
import {
  PORTAL_FILES_PANEL_MEDIA_QUERY,
  PortalFilesQueryParam,
  PortalFilesScope,
} from "./portal-files-query-params";

describe("PortalFilesQueryParam", () => {
  it("keeps the URL parameter names stable", () => {
    expect(PortalFilesQueryParam).toEqual({
      Origin: "origin",
      Selected: "selected",
      Scope: "scope",
      File: "file",
    });
  });

  it("names both project scopes without duplicates", () => {
    expect(PortalFilesScope).toEqual({ Project: "project", All: "all" });
    expect(new Set(Object.values(PortalFilesScope)).size).toBe(2);
  });

  it("shows the side panel from the wide desktop breakpoint", () => {
    expect(PORTAL_FILES_PANEL_MEDIA_QUERY).toBe("(min-width: 1100px)");
  });

  it("previews three entries per origin on the dashboard", () => {
    expect(DASHBOARD_FILES_PREVIEW_SIZE).toBe(3);
  });
});
