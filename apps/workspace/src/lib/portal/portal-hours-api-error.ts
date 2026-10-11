import "server-only";

import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { PortalHoursErrorCode as E } from "@invessiv/common/constants/portal/portal-hours-error-codes";
import { privateResponse } from "@/lib/http/private-no-store";

const ERRORS: Record<E, { status: H; message: string }> = {
  [E.NotFound]: { status: H.NotFound, message: "Not found." },
  [E.Validation]: {
    status: H.UnprocessableContent,
    message: "Invalid time entry query.",
  },
  [E.Internal]: {
    status: H.InternalServerError,
    message: "Hours are temporarily unavailable.",
  },
};

export function portalHoursErrorResponse(code: E): Response {
  const { status, message } = ERRORS[code];
  return Response.json({ code, message }, { status });
}

/**
 * Wraps authorization as well, so a denied request gets the same private caching. A thrown error
 * is logged by name only: SQL details could carry customer text.
 */
export function privatePortalHoursResponse(
  operation: () => Promise<Response>,
): Promise<Response> {
  return privateResponse(operation, (error) => {
    console.error("[portal-hours] request failed", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return portalHoursErrorResponse(E.Internal);
  });
}
