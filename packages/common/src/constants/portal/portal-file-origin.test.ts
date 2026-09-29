import { describe, expect, it } from "vitest";
import {
  PORTAL_FILE_ORIGIN_VALUES,
  PortalFileOrigin,
} from "./portal-file-origin";

describe("PortalFileOrigin", () => {
  it("lists both tabs exactly once", () => {
    expect(PORTAL_FILE_ORIGIN_VALUES).toEqual(["fromUs", "fromYou"]);
    expect(PORTAL_FILE_ORIGIN_VALUES).toEqual(Object.values(PortalFileOrigin));
    expect(new Set(PORTAL_FILE_ORIGIN_VALUES).size).toBe(
      PORTAL_FILE_ORIGIN_VALUES.length,
    );
  });
});
