import { ServiceTemplateErrorCode } from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const STATUS: Record<ServiceTemplateErrorCode, HttpResponseCode> = {
  [ServiceTemplateErrorCode.ServiceTemplateNotFound]: HttpResponseCode.NotFound,
  [ServiceTemplateErrorCode.ValidationError]:
    HttpResponseCode.UnprocessableContent,
  [ServiceTemplateErrorCode.Internal]: HttpResponseCode.InternalServerError,
};

const MESSAGES: Record<ServiceTemplateErrorCode, string> = {
  [ServiceTemplateErrorCode.ServiceTemplateNotFound]:
    "Service template not found",
  [ServiceTemplateErrorCode.ValidationError]: "Validation failed",
  [ServiceTemplateErrorCode.Internal]: "Unexpected server error",
};

/** `status` only overrides the mapping for a body that is not JSON at all (400 instead of 422). */
export function serviceTemplateApiError(
  code: ServiceTemplateErrorCode,
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
