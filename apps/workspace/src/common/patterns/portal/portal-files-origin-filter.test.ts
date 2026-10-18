import { describe, expect, it } from "vitest";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import { PortalFileOriginFilter } from "@/common/constants/portal/portal-file-origin-filter";
import { portalFilesOriginFilter } from "./portal-files-origin-filter";

describe("portalFilesOriginFilter", () => {
  it("accepts every filter and falls back to all files", () => {
    expect(portalFilesOriginFilter.read("fromYou")).toBe(
      PortalFileOriginFilter.FromYou,
    );
    expect(portalFilesOriginFilter.read("fromUs")).toBe(
      PortalFileOriginFilter.FromUs,
    );
    expect(portalFilesOriginFilter.read("all")).toBe(
      PortalFileOriginFilter.All,
    );
    expect(portalFilesOriginFilter.read(null)).toBe(PortalFileOriginFilter.All);
    expect(portalFilesOriginFilter.read("internal")).toBe(
      PortalFileOriginFilter.All,
    );
  });

  it("asks the server for both origins only under all", () => {
    expect(portalFilesOriginFilter.originOf(PortalFileOriginFilter.All)).toBe(
      null,
    );
    expect(
      portalFilesOriginFilter.originOf(PortalFileOriginFilter.FromYou),
    ).toBe(PortalFileOrigin.FromYou);
  });
});
