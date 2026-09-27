import "server-only";

import type { NextRequest } from "next/server";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { portalApiAuthError } from "./portal-api-auth-error";
import { portalAuthenticationService } from "./portal-authentication-service";
import type { PortalReader } from "./portal-reader";

type PortalReadApiHandler = (
  request: NextRequest,
  reader: PortalReader,
) => Promise<Response>;

/** Resolves a contact or a read-only owner view for a portal GET request. */
export function withPortalReader(
  customerId: string,
  handler: PortalReadApiHandler,
) {
  return async (request: NextRequest): Promise<Response> => {
    const authentication =
      await portalAuthenticationService.authenticateReader(customerId);
    if (authentication.status === PortalAuthStatus.Authorized)
      return handler(request, authentication.reader);
    return portalApiAuthError(authentication.status);
  };
}
