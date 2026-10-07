import "server-only";
import type { NextRequest } from "next/server";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import type { CredentialResult } from "@invessiv/common/contracts/credentials/credential-result";
import { privateResponse } from "@/lib/http/private-no-store";
import { withJsonBody } from "@/lib/http/with-json-body";
import { credentialErrorResponse } from "./credential-api-error";

export function credentialApiResponse<T>(
  result: CredentialResult<T>,
  successStatus: H = H.Ok,
): Response {
  if (result.ok) return Response.json(result.value, { status: successStatus });
  if ("conflict" in result)
    return Response.json(result.conflict, { status: H.Conflict });
  if (result.code === E.RateLimited)
    return credentialErrorResponse(result.code, {
      headers: {
        [HttpHeaderName.RetryAfter]: String(result.retryAfterSeconds),
      },
    });
  return credentialErrorResponse(result.code);
}

/** Wraps authorization too, so denied requests are `no-store` like every other answer. */
export async function privateCredentialResponse(
  operation: () => Promise<Response>,
): Promise<Response> {
  return privateResponse(operation, () => {
    // The error itself is not logged: SQL details or a crypto message could sit next to a secret.
    console.error("[credentials] request failed", { code: E.Internal });
    return credentialErrorResponse(E.Internal);
  });
}

export async function parseCredentialBody<T>(
  request: NextRequest,
  schema: {
    safeParse: (
      body: unknown,
    ) => { success: true; data: T } | { success: false };
  },
  run: (input: T) => Promise<Response>,
): Promise<Response> {
  return withJsonBody(
    request,
    (body) => {
      const parsed = schema.safeParse(body);
      return parsed.success
        ? run(parsed.data)
        : Promise.resolve(credentialErrorResponse(E.Validation));
    },
    () => credentialErrorResponse(E.Validation, { status: H.BadRequest }),
  );
}
