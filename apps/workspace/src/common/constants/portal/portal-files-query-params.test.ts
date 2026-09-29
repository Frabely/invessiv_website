import { describe, expect, it } from "vitest";
import { DASHBOARD_FILES_PREVIEW_SIZE } from "./portal-files-limits";
import { PortalFilesQueryParam } from "./portal-files-query-params";

describe("PortalFilesQueryParam", () => {
  it("keeps the URL parameter names stable", () => {
    expect(PortalFilesQueryParam).toEqual({
      Tab: "tab",
      Selected: "selected",
    });
  });

  it("previews three entries per tab on the dashboard", () => {
    expect(DASHBOARD_FILES_PREVIEW_SIZE).toBe(3);
  });
});
