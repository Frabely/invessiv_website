import { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const STATUS: Record<LineItemTemplateErrorCode, HttpResponseCode> = {
  [LineItemTemplateErrorCode.LineItemTemplateNotFound]:
    HttpResponseCode.NotFound,
  [LineItemTemplateErrorCode.ValidationError]:
    HttpResponseCode.UnprocessableContent,
  [LineItemTemplateErrorCode.Internal]: HttpResponseCode.InternalServerError,
};

const MESSAGES: Record<LineItemTemplateErrorCode, string> = {
  [LineItemTemplateErrorCode.LineItemTemplateNotFound]:
    "Line item template not found",
  [LineItemTemplateErrorCode.ValidationError]: "Validation failed",
  [LineItemTemplateErrorCode.Internal]: "Unexpected server error",
};

/** `status` only overrides the mapping for a body that is not JSON at all (400 instead of 422). */
export function lineItemTemplateApiError(
  code: LineItemTemplateErrorCode,
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
