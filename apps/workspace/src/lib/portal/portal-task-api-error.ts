import "server-only";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { PortalTaskErrorCode as E } from "@invessiv/common/constants/portal/portal-task-error-codes";
import {
  apiErrorResponse,
  privateApiResponse,
} from "@/lib/http/api-error-response";

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
  return apiErrorResponse(code, ERRORS[code]);
}

/**
 * Wraps authorization as well, so a denied request gets the same private caching. A thrown error
 * is logged by name only: SQL details could carry customer text.
 */
export function privatePortalTaskResponse(
  operation: () => Promise<Response>,
): Promise<Response> {
  return privateApiResponse(operation, "[portal-task] request failed", () =>
    portalTaskErrorResponse(E.Unavailable),
  );
}
