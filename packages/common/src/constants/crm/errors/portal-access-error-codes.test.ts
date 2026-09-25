import { describe, expect, it } from "vitest";
import { PortalAccessErrorCode } from "./portal-access-error-codes";

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
});
