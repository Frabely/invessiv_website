import "server-only";

import { auth } from "@clerk/nextjs/server";

import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { resolvePortalActor } from "@/server/portal/query-handler/resolve-portal-actor.query-handler";

import type { PortalActor } from "./portal-actor";
import type {
  PortalAuthentication,
  PortalReaderAuthentication,
} from "./portal-authentication-service-types";
import type { PortalReader } from "./portal-reader";
import { resolvePortalOwnerView } from "./resolve-portal-owner-view";

type PrincipalLookup<TPrincipal> =
  | { status: typeof PortalAuthStatus.Authorized; principal: TPrincipal }
  | { status: Exclude<PortalAuthStatus, typeof PortalAuthStatus.Authorized> };

/**
 * Shared front door of both operations. A malformed `customerId` is rejected before ever reaching
 * the database, for the same reason an unknown one is: the portal never confirms whether a value
 * looked like it could have been real.
 */
async function lookUpPrincipal<TPrincipal>(
  customerId: string,
  resolve: (clerkUserId: string) => Promise<TPrincipal | null>,
): Promise<PrincipalLookup<TPrincipal>> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { status: PortalAuthStatus.Unauthenticated };
  }

  if (!isUuid(customerId)) {
    return { status: PortalAuthStatus.NotMember };
  }

  try {
    const principal = await resolve(clerkUserId);
    return principal
      ? { status: PortalAuthStatus.Authorized, principal }
      : { status: PortalAuthStatus.NotMember };
  } catch (error: unknown) {
    console.error("[portal-auth] authorization lookup failed", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return { status: PortalAuthStatus.Unavailable };
  }
}

async function resolveActor(
  clerkUserId: string,
  customerId: string,
): Promise<PortalActor | null> {
  const resolution = await resolvePortalActor(clerkUserId, customerId);
  return resolution.ok ? resolution.actor : null;
}

/** The single entry point for portal authorization of a customer contact; every write path uses it. */
async function authenticateRequest(
  customerId: string,
): Promise<PortalAuthentication> {
  const lookup = await lookUpPrincipal(customerId, (clerkUserId) =>
    resolveActor(clerkUserId, customerId),
  );
  return lookup.status === PortalAuthStatus.Authorized
    ? { status: lookup.status, actor: lookup.principal }
    : lookup;
}

/**
 * Read paths only. A real membership always wins, so an owner who is also a contact of this
 * customer sees the genuine customer view; only without one is the owner view attempted.
 */
async function authenticateReader(
  customerId: string,
): Promise<PortalReaderAuthentication> {
  const lookup = await lookUpPrincipal<PortalReader>(
    customerId,
    async (clerkUserId) =>
      (await resolveActor(clerkUserId, customerId)) ??
      (await resolvePortalOwnerView(clerkUserId, customerId)),
  );
  return lookup.status === PortalAuthStatus.Authorized
    ? { status: lookup.status, reader: lookup.principal }
    : lookup;
}

/** Resolves who is asking for a customer's portal — the topic this service centers on. */
export const portalAuthenticationService = {
  authenticateRequest,
  authenticateReader,
} as const;
