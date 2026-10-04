import "server-only";

import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { PortalTaskErrorCode as E } from "@invessiv/common/constants/portal/portal-task-error-codes";
import { privateResponse } from "@/lib/http/private-no-store";

const ERRORS: Record<E, { status: H; message: string }> = {
  [E.NotFound]: { status: H.NotFound, message: "Task not found." },
  [E.Validation]: { status: H.UnprocessableContent, message: "Invalid task." },
  [E.NoAssignee]: {
    status: H.Conflict,
    message: "Nobody can take this task right now.",
  },
  [E.LimitReached]: {
    status: H.Conflict,
    message: "Too many open tasks for this project.",
  },
  [E.Unavailable]: {
    status: H.ServiceUnavailable,
    message: "Tasks are temporarily unavailable.",
  },
};

export function portalTaskErrorResponse(code: E): Response {
  const { status, message } = ERRORS[code];
  return Response.json({ code, message }, { status });
}

/**
 * Wraps authorization as well, so a denied request gets the same private caching. A thrown error
 * is logged by name only: SQL details could carry customer text.
 */
export function privatePortalTaskResponse(
  operation: () => Promise<Response>,
): Promise<Response> {
  return privateResponse(operation, (error) => {
    console.error("[portal-task] request failed", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return portalTaskErrorResponse(E.Unavailable);
  });
}
