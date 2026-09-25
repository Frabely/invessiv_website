import { describe, expect, it } from "vitest";
import { PortalInvitationErrorCode } from "@invessiv/common/constants/portal/portal-invitation-error-codes";
import { portalInvitationState } from "./portal-invitation-state";

const now = new Date("2026-09-25T12:00:00Z");
const open = {
  expiresAt: new Date("2026-09-26T12:00:00Z"),
  redeemedAt: null,
  revokedAt: null,
};

describe("portalInvitationState", () => {
  it("classifies unknown and revoked tokens without distinguishing them", () => {
    expect(portalInvitationState(null, now)).toBe(
      PortalInvitationErrorCode.Invalid,
    );
    expect(portalInvitationState({ ...open, revokedAt: now }, now)).toBe(
      PortalInvitationErrorCode.Invalid,
    );
  });

  it("distinguishes expired and redeemed invitations", () => {
    expect(portalInvitationState({ ...open, expiresAt: now }, now)).toBe(
      PortalInvitationErrorCode.Expired,
    );
    expect(portalInvitationState({ ...open, redeemedAt: now }, now)).toBe(
      PortalInvitationErrorCode.Redeemed,
    );
  });

  it("keeps a future unredeemed invitation open", () => {
    expect(portalInvitationState(open, now)).toBeNull();
  });
});
