import "server-only";

import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { PortalInvitationErrorCode } from "@invessiv/common/constants/portal/portal-invitation-error-codes";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { portalInvitations } from "@invessiv/db/record-configuration";
import { portalInvitationState } from "@/common/patterns/portal/portal-invitation-state";

/** Reads only token state; it does not grant access or consume the invitation. */
export async function getPortalInvitationState(
  token: string,
): Promise<PortalInvitationErrorCode | null> {
  if (!token) return PortalInvitationErrorCode.Invalid;
  const hash = createHash("sha256").update(token).digest("hex");
  const db = getDrizzleDatabaseClient();
  const [invitation] = await db
    .select({
      expiresAt: portalInvitations.expires_at,
      redeemedAt: portalInvitations.redeemed_at,
      revokedAt: portalInvitations.revoked_at,
    })
    .from(portalInvitations)
    .where(eq(portalInvitations.token_hash, hash))
    .limit(1);

  return portalInvitationState(invitation ?? null, new Date());
}
