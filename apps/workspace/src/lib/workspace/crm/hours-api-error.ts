import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const STATUS: Record<HoursErrorCode, HttpResponseCode> = {
  [HoursErrorCode.CustomerNotFound]: HttpResponseCode.NotFound,
  [HoursErrorCode.ProjectNotFound]: HttpResponseCode.NotFound,
  [HoursErrorCode.TimeEntryNotFound]: HttpResponseCode.NotFound,
  [HoursErrorCode.ProjectClosed]: HttpResponseCode.Conflict,
  [HoursErrorCode.InsufficientFreeHours]: HttpResponseCode.Conflict,
  [HoursErrorCode.InsufficientReleasableHours]: HttpResponseCode.Conflict,
  [HoursErrorCode.BelowAllocatedHours]: HttpResponseCode.Conflict,
  [HoursErrorCode.TaskNotLinkable]: HttpResponseCode.UnprocessableContent,
  [HoursErrorCode.ValidationError]: HttpResponseCode.UnprocessableContent,
  [HoursErrorCode.Internal]: HttpResponseCode.InternalServerError,
};

const MESSAGES: Record<HoursErrorCode, string> = {
  [HoursErrorCode.CustomerNotFound]: "Customer not found",
  [HoursErrorCode.ProjectNotFound]: "Project not found",
  [HoursErrorCode.TimeEntryNotFound]: "Time entry not found",
  [HoursErrorCode.ProjectClosed]: "Project takes no new hours",
  [HoursErrorCode.InsufficientFreeHours]: "Not enough free hours to allocate",
  [HoursErrorCode.InsufficientReleasableHours]:
    "Not enough unused hours to release",
  [HoursErrorCode.BelowAllocatedHours]:
    "Correction would fall below the allocated hours",
  [HoursErrorCode.TaskNotLinkable]:
    "Task is cancelled, unknown or belongs to another project",
  [HoursErrorCode.ValidationError]: "Validation failed",
  [HoursErrorCode.Internal]: "Unexpected server error",
};

/** `status` only overrides the mapping for a body that is not JSON at all (400 instead of 422). */
export function hoursApiError(
  code: HoursErrorCode,
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
