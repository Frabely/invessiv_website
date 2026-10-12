import { describe, expect, it } from "vitest";
import {
  PORTAL_SERVICE_REQUEST_ERROR_CODE_VALUES,
  PortalServiceRequestErrorCode,
} from "./portal-service-request-error-codes";

describe("PortalServiceRequestErrorCode", () => {
  it("keeps distinct codes without duplicates", () => {
    expect(PortalServiceRequestErrorCode).toEqual({
      NotFound: "not_found",
      Validation: "validation",
      LimitReached: "limit_reached",
      DuplicateOpen: "duplicate_open",
      Locked: "locked",
      Internal: "internal",
    });
    expect(PORTAL_SERVICE_REQUEST_ERROR_CODE_VALUES).toEqual(
      Object.values(PortalServiceRequestErrorCode),
    );
    expect(new Set(PORTAL_SERVICE_REQUEST_ERROR_CODE_VALUES).size).toBe(
      PORTAL_SERVICE_REQUEST_ERROR_CODE_VALUES.length,
    );
  });
});
