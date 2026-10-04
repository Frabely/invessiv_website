import "server-only";

import type { NextRequest } from "next/server";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { PortalFeedbackErrorCode as E } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { privateResponse } from "@/lib/http/private-no-store";
import { withJsonBody } from "@/lib/http/with-json-body";

const ERRORS: Record<E, { status: H; message: string }> = {
  [E.NotFound]: { status: H.NotFound, message: "Feedback not found." },
  [E.Locked]: {
    status: H.Conflict,
    message: "This feedback round can no longer be changed.",
  },
  [E.Validation]: { status: H.BadRequest, message: "Invalid feedback." },
  [E.ItemsRequired]: {
    status: H.UnprocessableContent,
    message: "Add at least one feedback item.",
  },
  [E.ItemTextRequired]: {
    status: H.UnprocessableContent,
    message: "Every feedback item needs a text.",
  },
  [E.ItemsPresent]: {
    status: H.UnprocessableContent,
    message: "Submit your feedback items instead of approving.",
  },
  [E.NotLatest]: {
    status: H.Conflict,
    message: "Only the latest round can be approved.",
  },
  [E.ConfirmationRequired]: {
    status: H.UnprocessableContent,
    message: "Please confirm the approval.",
  },
  [E.AttachmentLimit]: {
    status: H.UnprocessableContent,
    message: "No more files fit on this item or round.",
  },
  [E.NotAttachable]: {
    status: H.UnprocessableContent,
    message: "This file cannot be attached.",
  },
  [E.Unavailable]: {
    status: H.ServiceUnavailable,
    message: "Feedback is temporarily unavailable.",
  },
};

function errorResponse(
  code: E,
  details: Record<string, unknown> = {},
): Response {
  const { status, message } = ERRORS[code];
  return Response.json({ code, message, ...details }, { status });
}

export function portalFeedbackApiResponse<T>(
  result: PortalFeedbackResult<T>,
  successStatus: H = H.Ok,
  canReadResponse = true,
): Response {
  if (result.ok)
    return Response.json(canReadResponse ? result.value : { accepted: true }, {
      status: successStatus,
    });
  if (result.code === ConcurrencyErrorCode.VersionConflict)
    return Response.json(
      canReadResponse
        ? result.conflict
        : {
            code: result.conflict.code,
            currentVersion: result.conflict.currentVersion,
          },
      { status: H.Conflict },
    );
  if (result.code === E.ItemTextRequired)
    return errorResponse(
      result.code,
      canReadResponse ? { itemIds: result.itemIds } : {},
    );
  return errorResponse(result.code);
}

/** A write grant never implies that its full feedback response may be read. */
export function portalFeedbackWriteResponse<T>(
  actor: PortalActor,
  result: PortalFeedbackResult<T>,
  successStatus: H = H.Ok,
): Response {
  return portalFeedbackApiResponse(
    result,
    successStatus,
    portalFeedbackService.canRead(actor),
  );
}

export function portalFeedbackNotFound(): Response {
  return errorResponse(E.NotFound);
}

/** A body that is not JSON at all is rejected here; the command validates its shape. */
export function withPortalFeedbackBody<T>(
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
 * is logged by name only: SQL details could carry customer text.
 */
export function privatePortalFeedbackResponse(
  operation: () => Promise<Response>,
): Promise<Response> {
  return privateResponse(operation, (error) => {
    console.error("[portal-feedback] request failed", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return errorResponse(E.Unavailable);
  });
}
