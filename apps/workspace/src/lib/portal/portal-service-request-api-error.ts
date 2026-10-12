import "server-only";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { PortalServiceRequestErrorCode as E } from "@invessiv/common/constants/portal/portal-service-request-error-codes";
import {
  apiErrorResponse,
  privateApiResponse,
} from "@/lib/http/api-error-response";

const ERRORS: Record<E, { status: H; message: string }> = {
  [E.NotFound]: { status: H.NotFound, message: "Not found." },
  [E.Validation]: {
    status: H.UnprocessableContent,
    message: "Invalid service request.",
  },
  [E.LimitReached]: {
    status: H.Conflict,
    message: "Too many open service requests.",
  },
  [E.DuplicateOpen]: {
    status: H.Conflict,
    message: "This service is already requested for the project.",
  },
  [E.Locked]: {
    status: H.Conflict,
    message: "The service request can no longer be withdrawn.",
  },
  [E.Internal]: {
    status: H.InternalServerError,
    message: "Service requests are temporarily unavailable.",
  },
};

export function portalServiceRequestErrorResponse(code: E): Response {
  return apiErrorResponse(code, ERRORS[code]);
}

/**
 * Wraps authorization as well, so a denied request gets the same private caching. A thrown error
 * is logged by name only: SQL details could carry customer text.
 */
export function privatePortalServiceRequestResponse(
  operation: () => Promise<Response>,
): Promise<Response> {
  return privateApiResponse(
    operation,
    "[portal-service-request] request failed",
    () => portalServiceRequestErrorResponse(E.Internal),
  );
}
