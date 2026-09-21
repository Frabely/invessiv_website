import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const STATUS: Record<ProjectLineItemErrorCode, HttpResponseCode> = {
  [ProjectLineItemErrorCode.ProjectLineItemNotFound]: HttpResponseCode.NotFound,
  [ProjectLineItemErrorCode.ProjectNotFound]: HttpResponseCode.NotFound,
  [ProjectLineItemErrorCode.LineItemTemplateNotAssignable]:
    HttpResponseCode.UnprocessableContent,
  [ProjectLineItemErrorCode.ValidationError]:
    HttpResponseCode.UnprocessableContent,
  [ProjectLineItemErrorCode.Internal]: HttpResponseCode.InternalServerError,
};

const MESSAGES: Record<ProjectLineItemErrorCode, string> = {
  [ProjectLineItemErrorCode.ProjectLineItemNotFound]:
    "Project line item not found",
  [ProjectLineItemErrorCode.ProjectNotFound]: "Project not found",
  [ProjectLineItemErrorCode.LineItemTemplateNotAssignable]:
    "Line item template is archived or unknown",
  [ProjectLineItemErrorCode.ValidationError]: "Validation failed",
  [ProjectLineItemErrorCode.Internal]: "Unexpected server error",
};

/** `status` only overrides the mapping for a body that is not JSON at all (400 instead of 422). */
export function projectLineItemApiError(
  code: ProjectLineItemErrorCode,
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
