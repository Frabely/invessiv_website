import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const STATUS: Record<TaskErrorCode, HttpResponseCode> = {
  [TaskErrorCode.TaskNotFound]: HttpResponseCode.NotFound,
  [TaskErrorCode.ProjectNotFound]: HttpResponseCode.NotFound,
  [TaskErrorCode.AssigneeNotActive]: HttpResponseCode.UnprocessableContent,
  [TaskErrorCode.ValidationError]: HttpResponseCode.UnprocessableContent,
  [TaskErrorCode.Internal]: HttpResponseCode.InternalServerError,
};

const MESSAGES: Record<TaskErrorCode, string> = {
  [TaskErrorCode.TaskNotFound]: "Task not found",
  [TaskErrorCode.ProjectNotFound]: "Project not found",
  [TaskErrorCode.AssigneeNotActive]: "Assignee is not an active member",
  [TaskErrorCode.ValidationError]: "Validation failed",
  [TaskErrorCode.Internal]: "Unexpected server error",
};

/** `status` only overrides the mapping for a body that is not JSON at all (400 instead of 422). */
export function taskApiError(
  code: TaskErrorCode,
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
