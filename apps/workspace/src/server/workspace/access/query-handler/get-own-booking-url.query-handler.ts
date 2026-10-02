import "server-only";

import { eq } from "drizzle-orm";

import type { OwnBookingUrlDto } from "@invessiv/common/contracts/auth/own-booking-url.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { workspaceMembers } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

/**
 * The booking link of the signed-in member. The member comes from the actor alone, so this
 * handler cannot be pointed at anyone else.
 */
export async function getOwnBookingUrl(
  actor: WorkspaceActor,
): Promise<OwnBookingUrlDto | null> {
  const [row] = await getDrizzleDatabaseClient()
    .select({
      bookingUrl: workspaceMembers.booking_url,
      version: workspaceMembers.version,
    })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.id, actor.workspaceMemberId))
    .limit(1);
  return row ?? null;
}
