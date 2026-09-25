import { PortalInvitationErrorCode } from "@invessiv/common/constants/portal/portal-invitation-error-codes";

type InvitationStateRow = {
  expiresAt: Date;
  redeemedAt: Date | null;
  revokedAt: Date | null;
};

export function portalInvitationState(
  invitation: InvitationStateRow | null,
  now: Date,
): PortalInvitationErrorCode | null {
  if (!invitation || invitation.revokedAt)
    return PortalInvitationErrorCode.Invalid;
  if (invitation.redeemedAt) return PortalInvitationErrorCode.Redeemed;
  if (invitation.expiresAt <= now) return PortalInvitationErrorCode.Expired;
  return null;
}
