import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import type { Locale } from "@/config/i18n";
import { portalPathFor, signInPathWithRedirect } from "@/lib/auth/routes";

import { authenticatePortalRequest } from "./portal-authentication";
import { PortalAuthorizationUnavailableError } from "./portal-authorization-unavailable-error.class";
import type { PortalActor } from "./portal-actor";

// Layout and page of one render share the lookup for the same customer; the next request
// resolves again, and a different customerId in the same render gets its own lookup.
const authenticateForRender = cache(authenticatePortalRequest);

/**
 * Resolves the portal actor for exactly this customer, or ends the render. `customerId` is a
 * value from the URL, never trusted on its own — this is the one place it gets checked against a
 * real membership.
 */
export async function requirePortalActor(
  locale: Locale,
  customerId: string,
): Promise<PortalActor> {
  const authentication = await authenticateForRender(customerId);

  if (authentication.status === PortalAuthStatus.Authorized) {
    return authentication.actor;
  }
  if (authentication.status === PortalAuthStatus.Unauthenticated) {
    redirect(signInPathWithRedirect(locale, portalPathFor(locale, customerId)));
  }
  if (authentication.status === PortalAuthStatus.NotMember) {
    notFound();
  }

  throw new PortalAuthorizationUnavailableError();
}
