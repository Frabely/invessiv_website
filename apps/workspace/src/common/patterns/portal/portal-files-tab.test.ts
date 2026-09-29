import { describe, expect, it } from "vitest";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import { readPortalFilesTab } from "./portal-files-tab";

describe("readPortalFilesTab", () => {
  it("accepts both tabs and falls back to the released files", () => {
    expect(readPortalFilesTab("fromYou")).toBe(PortalFileOrigin.FromYou);
    expect(readPortalFilesTab("fromUs")).toBe(PortalFileOrigin.FromUs);
    expect(readPortalFilesTab(null)).toBe(PortalFileOrigin.FromUs);
    expect(readPortalFilesTab("internal")).toBe(PortalFileOrigin.FromUs);
  });
});
