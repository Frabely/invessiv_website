import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { PortalOnboardingErrorCode as E } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import { privateResponse } from "@/lib/http/private-no-store";
import { withJsonBody } from "@/lib/http/with-json-body";

const ERRORS: Record<E, { status: H; message: string }> = {
  [E.NotFound]: { status: H.NotFound, message: "Onboarding form not found." },
  [E.Locked]: {
    status: H.Conflict,
    message: "This onboarding form can no longer be changed.",
  },
  [E.Validation]: {
    status: H.UnprocessableContent,
    message: "Invalid answer.",
  },
  [E.RequiredMissing]: {
    status: H.UnprocessableContent,
    message: "Required answers are missing.",
  },
  [E.LimitReached]: {
    status: H.UnprocessableContent,
    message: "No more entries fit here.",
  },
  [E.NotAttachable]: {
    status: H.UnprocessableContent,
    message: "This file cannot be attached.",
  },
  [E.Unavailable]: {
    status: H.ServiceUnavailable,
    message: "The onboarding form is temporarily unavailable.",
  },
};

function errorResponse(
  code: E,
  details: Record<string, unknown> = {},
): Response {
  const { status, message } = ERRORS[code];
  return Response.json({ code, message, ...details }, { status });
}

export function portalOnboardingApiResponse<T>(
  result: PortalOnboardingResult<T>,
): Response {
  if (result.ok) return Response.json(result.value, { status: H.Ok });
  if (result.code === E.RequiredMissing)
    return errorResponse(result.code, { missing: result.missing });
  return errorResponse(result.code);
}

export function portalOnboardingNotFound(): Response {
  return errorResponse(E.NotFound);
}

/** A body that is not JSON at all is rejected here; the command validates its shape. */
export function withPortalOnboardingBody<T>(
  request: NextRequest,
  run: (body: T) => Promise<Response>,
): Promise<Response> {
  return withJsonBody(
    request,
    (body) => run(body as T),
    () => errorResponse(E.Validation),
  );
}

/**
 * Wraps authorization as well, so a denied request gets the same private caching. A thrown error
 * is logged by name only: SQL details could carry customer answers.
 */
export function privatePortalOnboardingResponse(
  operation: () => Promise<Response>,
): Promise<Response> {
  return privateResponse(operation, (error) => {
    console.error("[portal-onboarding] request failed", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return errorResponse(E.Unavailable);
  });
}
