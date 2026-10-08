import "server-only";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";

const STATUS_BY_CODE: Record<E, H> = {
  [E.NotFound]: H.NotFound,
  [E.Validation]: H.UnprocessableContent,
  [E.NotConfigured]: H.ServiceUnavailable,
  [E.RateLimited]: H.TooManyRequests,
  [E.CustomerOwned]: H.Conflict,
  [E.ProjectHidden]: H.Conflict,
  [E.Internal]: H.InternalServerError,
};

const MESSAGES: Record<E, string> = {
  [E.NotFound]: "Credential or target not found.",
  [E.Validation]: "Invalid credential request.",
  [E.NotConfigured]: "Credential encryption is not configured.",
  [E.RateLimited]: "Too many reveals. Try again shortly.",
  [E.CustomerOwned]:
    "The customer created this credential; its release cannot be withdrawn.",
  [E.ProjectHidden]:
    "The project of this credential is not visible in the portal.",
  [E.Internal]: "The credential request failed.",
};

export function credentialErrorResponse(
  code: E,
  options: { status?: H; headers?: Record<string, string> } = {},
): Response {
  return Response.json(
    { code, message: MESSAGES[code] },
    {
      status: options.status ?? STATUS_BY_CODE[code],
      headers: options.headers,
    },
  );
}
