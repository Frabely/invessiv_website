import { describe, expect, it } from "vitest";
import {
  PORTAL_ACCESS_ERROR_CODE_VALUES,
  PortalAccessErrorCode,
} from "./portal-access-error-codes";

describe("PortalAccessErrorCode", () => {
  it("keeps distinct codes without duplicates", () => {
    expect(PortalAccessErrorCode).toEqual({
      CustomerNotFound: "customer_not_found",
      AssignmentNotFound: "assignment_not_found",
      PreviewNotConfirmed: "portal_preview_not_confirmed",
      MembershipAlreadyActive: "portal_membership_already_active",
      InvalidPortalRole: "invalid_portal_role",
      ValidationError: "validation_error",
      NotFound: "not_found",
      InvalidRoles: "invalid_roles",
      Unavailable: "unavailable",
    });
    const values = Object.values(PortalAccessErrorCode);
    expect(new Set(values).size).toBe(values.length);
  });

  it("derives PORTAL_ACCESS_ERROR_CODE_VALUES from the const object without duplicates", () => {
    expect(PORTAL_ACCESS_ERROR_CODE_VALUES).toEqual(
      Object.values(PortalAccessErrorCode),
    );
    expect(new Set(PORTAL_ACCESS_ERROR_CODE_VALUES).size).toBe(
      PORTAL_ACCESS_ERROR_CODE_VALUES.length,
    );
  });
});
