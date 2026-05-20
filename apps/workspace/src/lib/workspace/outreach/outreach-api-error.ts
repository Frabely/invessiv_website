import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { OutreachErrorCode } from "@invessiv/common/constants/leads/outreach/lead-outreach-error-codes";

const MESSAGES: Record<OutreachErrorCode, string> = {
  [OutreachErrorCode.LeadNotFound]: "Lead not found",
  [OutreachErrorCode.ValidationError]: "Validation failed",
  [OutreachErrorCode.NotConfigured]: "Nicht konfiguriert",
  [OutreachErrorCode.ProviderUnavailable]: "Outreach provider unavailable",
  [OutreachErrorCode.Internal]: "Unexpected server error",
};

export function outreachApiError(
  code: OutreachErrorCode,
  status: HttpResponseCode,
  details?: unknown,
): Response {
  return Response.json(
    {
      error: code,
      message: MESSAGES[code],
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  );
}
