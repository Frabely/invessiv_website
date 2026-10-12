import "server-only";
import type { ApiErrorDefinition } from "@/common/contracts/http/api-error-definition";
import { privateResponse } from "./private-no-store";

export function apiErrorResponse(
  code: string,
  { status, message }: ApiErrorDefinition,
): Response {
  return Response.json({ code, message }, { status });
}

/** Logs names only: database messages can contain customer text. */
export function privateApiResponse(
  operation: () => Promise<Response>,
  context: string,
  fallback: () => Response,
): Promise<Response> {
  return privateResponse(operation, (error) => {
    console.error(context, {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return fallback();
  });
}
