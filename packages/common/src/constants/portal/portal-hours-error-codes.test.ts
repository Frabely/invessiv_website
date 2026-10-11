import { describe, expect, it } from "vitest";
import {
  PORTAL_HOURS_ERROR_CODE_VALUES,
  PortalHoursErrorCode,
} from "./portal-hours-error-codes";

describe("PortalHoursErrorCode", () => {
  it("keeps distinct codes without duplicates", () => {
    expect(PortalHoursErrorCode).toEqual({
      NotFound: "not_found",
      Validation: "validation",
      Internal: "internal",
    });
    expect(PORTAL_HOURS_ERROR_CODE_VALUES).toEqual(
      Object.values(PortalHoursErrorCode),
    );
    expect(new Set(PORTAL_HOURS_ERROR_CODE_VALUES).size).toBe(
      PORTAL_HOURS_ERROR_CODE_VALUES.length,
    );
  });
});
