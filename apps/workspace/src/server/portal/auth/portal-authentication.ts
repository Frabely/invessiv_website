import "server-only";

import { auth } from "@clerk/nextjs/server";

import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { resolvePortalActor } from "@/server/portal/query-handler/resolve-portal-actor.query-handler";

import type { PortalAuthentication } from "./portal-authentication-types";

/**
 * The single entry point for portal authorization. A malformed `customerId` is rejected before
 * ever reaching the database, for the same reason an unknown one is: the portal never confirms
 * whether a value looked like it could have been real.
 */
export async function authenticatePortalRequest(
  customerId: string,
): Promise<PortalAuthentication> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { status: PortalAuthStatus.Unauthenticated };
  }

  if (!isUuid(customerId)) {
    return { status: PortalAuthStatus.NotMember };
  }

  try {
    const resolution = await resolvePortalActor(clerkUserId, customerId);
    if (resolution.ok) {
      return { status: PortalAuthStatus.Authorized, actor: resolution.actor };
    }
    return { status: PortalAuthStatus.NotMember };
  } catch (error: unknown) {
    console.error("[portal-auth] authorization lookup failed", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return { status: PortalAuthStatus.Unavailable };
  }
}
