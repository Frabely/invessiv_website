import { LeadErrorCode } from "@/common/constants/leads/errors/lead-error-codes";

const MESSAGES: Record<LeadErrorCode, string> = {
  [LeadErrorCode.NotFound]: "Lead not found",
  [LeadErrorCode.ValidationError]: "Validation failed",
  [LeadErrorCode.EmailExists]: "A lead with this email already exists",
  [LeadErrorCode.Internal]: "Unexpected server error",
};

export function leadApiError(
  code: LeadErrorCode,
  status: number,
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
