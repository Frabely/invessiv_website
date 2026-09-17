import { ProjectErrorCode } from "@invessiv/common/constants/crm/errors/project-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const STATUS: Record<ProjectErrorCode, HttpResponseCode> = {
  [ProjectErrorCode.NotFound]: HttpResponseCode.NotFound,
  [ProjectErrorCode.ValidationError]: HttpResponseCode.UnprocessableContent,
};

const MESSAGES: Record<ProjectErrorCode, string> = {
  [ProjectErrorCode.NotFound]: "Project not found",
  [ProjectErrorCode.ValidationError]: "Validation failed",
};

/** `status` only overrides the mapping for a body that is not JSON at all (400 instead of 422). */
export function projectApiError(
  code: ProjectErrorCode,
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
