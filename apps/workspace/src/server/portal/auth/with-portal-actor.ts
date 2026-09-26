import "server-only";

import type { NextRequest } from "next/server";

import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";

import { portalAuthenticationService } from "./portal-authentication-service";
import { portalApiAuthError } from "./portal-api-auth-error";
import type { PortalActor } from "./portal-actor";

type PortalApiHandler = (
  request: NextRequest,
  actor: PortalActor,
) => Promise<Response>;

/**
 * Resolves `customerId` from the route's own params into a `PortalActor` and only then calls the
 * handler — the handler never receives a raw customer id. Counterpart to `withWorkspaceApiActor`;
 * API routes never redirect.
 */
export function withPortalActor(customerId: string, handler: PortalApiHandler) {
  return async (request: NextRequest): Promise<Response> => {
    const authentication =
      await portalAuthenticationService.authenticateRequest(customerId);

    if (authentication.status === PortalAuthStatus.Authorized) {
      return handler(request, authentication.actor);
    }
    return portalApiAuthError(authentication.status);
  };
}
