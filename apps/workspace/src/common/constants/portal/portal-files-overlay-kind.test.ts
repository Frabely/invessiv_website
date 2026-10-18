import { describe, expect, it } from "vitest";
import { PortalFilesOverlayKind } from "./portal-files-overlay-kind";

describe("PortalFilesOverlayKind", () => {
  it("defines distinct add and preview variants", () => {
    expect(PortalFilesOverlayKind).toEqual({ Add: "add", Preview: "preview" });
    const values = Object.values(PortalFilesOverlayKind);
    expect(new Set(values).size).toBe(values.length);
  });
});
