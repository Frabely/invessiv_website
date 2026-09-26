import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import type { Locale } from "@/config/i18n";
import { portalPathFor, signInPathWithRedirect } from "@/lib/auth/routes";

import { portalAuthenticationService } from "./portal-authentication-service";
import { PortalAuthorizationUnavailableError } from "./portal-authorization-unavailable-error.class";
import type { PortalReader } from "./portal-reader";

// Layout and page of one render share the lookup, so an owner view writes one security event per
// render, not one per component.
const authenticateForRender = cache(
  portalAuthenticationService.authenticateReader,
);

/**
 * Page gate for read-only portal pages: a contact of this customer, or the workspace owner in
 * read-only view. Write paths never use it — they stay on `withPortalActor`.
 */
export async function requirePortalReader(
  locale: Locale,
  customerId: string,
): Promise<PortalReader> {
  const authentication = await authenticateForRender(customerId);

  if (authentication.status === PortalAuthStatus.Authorized) {
    return authentication.reader;
  }
  if (authentication.status === PortalAuthStatus.Unauthenticated) {
    redirect(signInPathWithRedirect(locale, portalPathFor(locale, customerId)));
  }
  if (authentication.status === PortalAuthStatus.NotMember) {
    notFound();
  }

  throw new PortalAuthorizationUnavailableError();
}
