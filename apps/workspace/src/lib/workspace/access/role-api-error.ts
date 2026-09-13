import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const STATUS: Record<RoleErrorCode, HttpResponseCode> = {
  [RoleErrorCode.RoleNotFound]: HttpResponseCode.NotFound,
  [RoleErrorCode.ValidationError]: HttpResponseCode.BadRequest,
  [RoleErrorCode.RoleNameTaken]: HttpResponseCode.Conflict,
  [RoleErrorCode.PermissionNotDelegable]: HttpResponseCode.UnprocessableContent,
  [RoleErrorCode.SystemRoleImmutable]: HttpResponseCode.UnprocessableContent,
  [RoleErrorCode.Internal]: HttpResponseCode.InternalServerError,
};

const MESSAGES: Record<RoleErrorCode, string> = {
  [RoleErrorCode.RoleNotFound]: "Role not found",
  [RoleErrorCode.ValidationError]: "Validation failed",
  [RoleErrorCode.RoleNameTaken]: "A role with this name already exists",
  [RoleErrorCode.PermissionNotDelegable]:
    "Custom roles cannot hold non-delegable permissions",
  [RoleErrorCode.SystemRoleImmutable]: "System roles cannot be changed",
  [RoleErrorCode.Internal]: "Unexpected server error",
};

export function roleApiError(code: RoleErrorCode, details?: unknown): Response {
  return Response.json(
    {
      error: code,
      message: MESSAGES[code],
      ...(details !== undefined ? { details } : {}),
    },
    { status: STATUS[code] },
  );
}
