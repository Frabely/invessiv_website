import type { LeadConversionErrorCode as LeadConversionErrorCodeType } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const STATUS: Record<LeadConversionErrorCodeType, HttpResponseCode> = {
  [LeadConversionErrorCode.DisplayNameTaken]: HttpResponseCode.Conflict,
  [LeadConversionErrorCode.Internal]: HttpResponseCode.InternalServerError,
  [LeadConversionErrorCode.LeadNotFound]: HttpResponseCode.NotFound,
  [LeadConversionErrorCode.OwnerInactive]: HttpResponseCode.Conflict,
  [LeadConversionErrorCode.ValidationError]:
    HttpResponseCode.UnprocessableContent,
};

const MESSAGES: Record<LeadConversionErrorCodeType, string> = {
  [LeadConversionErrorCode.DisplayNameTaken]:
    "A customer with this display name already exists",
  [LeadConversionErrorCode.Internal]: "Unexpected server error",
  [LeadConversionErrorCode.LeadNotFound]: "Lead not found",
  [LeadConversionErrorCode.OwnerInactive]:
    "The owner is no longer an active member",
  [LeadConversionErrorCode.ValidationError]: "Validation failed",
};

export function leadConversionApiError(
  code: LeadConversionErrorCodeType,
  options: { details?: unknown; status?: HttpResponseCode } = {},
): Response {
  return Response.json(
    {
      error: code,
      message: MESSAGES[code],
      ...(options.details !== undefined ? { details: options.details } : {}),
    },
    { status: options.status ?? STATUS[code] },
  );
}
