import { describe, expect, it } from "vitest";
import {
  PORTAL_FILE_ORIGIN_FILTER_VALUES,
  PortalFileOriginFilter,
} from "./portal-file-origin-filter";

describe("PortalFileOriginFilter", () => {
  it("offers both origins and all of them without duplicates", () => {
    expect(PortalFileOriginFilter).toEqual({
      All: "all",
      FromUs: "fromUs",
      FromYou: "fromYou",
    });
    expect(PORTAL_FILE_ORIGIN_FILTER_VALUES).toEqual([
      "all",
      "fromUs",
      "fromYou",
    ]);
    expect(new Set(PORTAL_FILE_ORIGIN_FILTER_VALUES).size).toBe(3);
  });
});
