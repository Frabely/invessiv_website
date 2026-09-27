import "server-only";

import { AuthErrorCode } from "@invessiv/common/constants/auth/auth-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { authApiError } from "@/lib/auth/auth-api-error";

export function portalApiAuthError(
  status: Exclude<PortalAuthStatus, typeof PortalAuthStatus.Authorized>,
): Response {
  if (status === PortalAuthStatus.Unauthenticated)
    return authApiError(
      AuthErrorCode.Unauthorized,
      HttpResponseCode.Unauthorized,
    );
  if (status === PortalAuthStatus.NotMember)
    return authApiError(AuthErrorCode.NotFound, HttpResponseCode.NotFound);
  return authApiError(
    AuthErrorCode.Unavailable,
    HttpResponseCode.ServiceUnavailable,
  );
}
