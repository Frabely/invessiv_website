import "server-only";

import type { NextRequest } from "next/server";

import { AuthErrorCode } from "@invessiv/common/constants/auth/auth-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { authApiError } from "@/lib/auth/auth-api-error";

import { authenticatePortalRequest } from "./portal-authentication";
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
    const authentication = await authenticatePortalRequest(customerId);

    if (authentication.status === PortalAuthStatus.Authorized) {
      return handler(request, authentication.actor);
    }
    if (authentication.status === PortalAuthStatus.Unauthenticated) {
      return authApiError(
        AuthErrorCode.Unauthorized,
        HttpResponseCode.Unauthorized,
      );
    }
    if (authentication.status === PortalAuthStatus.NotMember) {
      return authApiError(AuthErrorCode.NotFound, HttpResponseCode.NotFound);
    }

    return authApiError(
      AuthErrorCode.Unavailable,
      HttpResponseCode.ServiceUnavailable,
    );
  };
}
