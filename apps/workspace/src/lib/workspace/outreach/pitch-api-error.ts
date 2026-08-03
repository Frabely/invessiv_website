import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";

const MESSAGES: Record<LeadPitchErrorCode, string> = {
  [LeadPitchErrorCode.LeadNotFound]: "Lead not found",
  [LeadPitchErrorCode.NoProfileData]: "Profile data is not usable",
  [LeadPitchErrorCode.IcebreakerTooLong]: "Icebreaker exceeds the char limit",
  [LeadPitchErrorCode.TemplateInvalid]: "Pitch template is invalid",
  [LeadPitchErrorCode.ValidationError]: "Validation failed",
  [LeadPitchErrorCode.NotConfigured]: "Pitch provider is not configured",
  [LeadPitchErrorCode.AuthenticationFailed]:
    "Pitch provider authentication failed",
  [LeadPitchErrorCode.ModelUnavailable]:
    "Configured pitch model is unavailable",
  [LeadPitchErrorCode.ProviderRateLimited]: "Pitch provider rate limit reached",
  [LeadPitchErrorCode.ProviderRejected]: "Pitch provider rejected the request",
  [LeadPitchErrorCode.ProviderInvalidResponse]:
    "Pitch provider returned an invalid response",
  [LeadPitchErrorCode.ProviderUnavailable]: "Pitch provider unavailable",
  [LeadPitchErrorCode.Internal]: "Unexpected pitch server error",
};

const STATUS_BY_CODE: Record<LeadPitchErrorCode, HttpResponseCode> = {
  [LeadPitchErrorCode.LeadNotFound]: HttpResponseCode.NotFound,
  [LeadPitchErrorCode.NoProfileData]: HttpResponseCode.UnprocessableContent,
  [LeadPitchErrorCode.IcebreakerTooLong]: HttpResponseCode.UnprocessableContent,
  [LeadPitchErrorCode.TemplateInvalid]: HttpResponseCode.InternalServerError,
  [LeadPitchErrorCode.ValidationError]: HttpResponseCode.BadRequest,
  [LeadPitchErrorCode.NotConfigured]: HttpResponseCode.ServiceUnavailable,
  [LeadPitchErrorCode.AuthenticationFailed]:
    HttpResponseCode.ServiceUnavailable,
  [LeadPitchErrorCode.ModelUnavailable]: HttpResponseCode.ServiceUnavailable,
  [LeadPitchErrorCode.ProviderRateLimited]: HttpResponseCode.TooManyRequests,
  [LeadPitchErrorCode.ProviderRejected]: HttpResponseCode.BadGateway,
  [LeadPitchErrorCode.ProviderInvalidResponse]: HttpResponseCode.BadGateway,
  [LeadPitchErrorCode.ProviderUnavailable]: HttpResponseCode.ServiceUnavailable,
  [LeadPitchErrorCode.Internal]: HttpResponseCode.InternalServerError,
};

export function pitchApiError(
  code: LeadPitchErrorCode,
  details?: unknown,
  errorId?: string,
): Response {
  return Response.json(
    {
      error: code,
      message: MESSAGES[code],
      ...(details !== undefined ? { details } : {}),
      ...(errorId !== undefined ? { errorId } : {}),
    },
    { status: STATUS_BY_CODE[code] },
  );
}
