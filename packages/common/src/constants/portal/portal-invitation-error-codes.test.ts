import { describe, expect, it } from "vitest";
import { PortalInvitationErrorCode } from "./portal-invitation-error-codes";

describe("PortalInvitationErrorCode", () => {
  it("keeps distinct codes without duplicates", () => {
    expect(PortalInvitationErrorCode).toEqual({
      Invalid: "invalid",
      Expired: "expired",
      Redeemed: "redeemed",
      Unauthenticated: "unauthenticated",
      Unavailable: "unavailable",
    });
    const values = Object.values(PortalInvitationErrorCode);
    expect(new Set(values).size).toBe(values.length);
  });
});
