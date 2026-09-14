import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const STATUS: Record<WorkspaceMemberErrorCode, HttpResponseCode> = {
  [WorkspaceMemberErrorCode.MemberNotFound]: HttpResponseCode.NotFound,
  [WorkspaceMemberErrorCode.ValidationError]: HttpResponseCode.BadRequest,
  [WorkspaceMemberErrorCode.ClerkAccountNotFound]: HttpResponseCode.NotFound,
  [WorkspaceMemberErrorCode.ClerkAccountIncomplete]:
    HttpResponseCode.UnprocessableContent,
  [WorkspaceMemberErrorCode.ClerkAccountAlreadyLinked]:
    HttpResponseCode.Conflict,
  [WorkspaceMemberErrorCode.ClerkUnavailable]:
    HttpResponseCode.ServiceUnavailable,
  [WorkspaceMemberErrorCode.RoleNotAssignable]:
    HttpResponseCode.UnprocessableContent,
  [WorkspaceMemberErrorCode.OwnerRoleNotAssignable]:
    HttpResponseCode.UnprocessableContent,
  [WorkspaceMemberErrorCode.MemberWithoutRole]:
    HttpResponseCode.UnprocessableContent,
  [WorkspaceMemberErrorCode.AlreadyOwner]: HttpResponseCode.Conflict,
  [WorkspaceMemberErrorCode.NotOwner]: HttpResponseCode.Conflict,
  [WorkspaceMemberErrorCode.LastActiveOwner]: HttpResponseCode.Conflict,
  [WorkspaceMemberErrorCode.SelfOwnerRevocation]: HttpResponseCode.Conflict,
  [WorkspaceMemberErrorCode.MemberAlreadyActive]: HttpResponseCode.Conflict,
  [WorkspaceMemberErrorCode.MemberAlreadyInactive]: HttpResponseCode.Conflict,
  [WorkspaceMemberErrorCode.SelfDeactivation]: HttpResponseCode.Conflict,
  [WorkspaceMemberErrorCode.MemberHasOpenResponsibilities]:
    HttpResponseCode.Conflict,
  [WorkspaceMemberErrorCode.MemberInactive]: HttpResponseCode.Conflict,
  [WorkspaceMemberErrorCode.Internal]: HttpResponseCode.InternalServerError,
};

const MESSAGES: Record<WorkspaceMemberErrorCode, string> = {
  [WorkspaceMemberErrorCode.MemberNotFound]: "Workspace member not found",
  [WorkspaceMemberErrorCode.ValidationError]: "Validation failed",
  [WorkspaceMemberErrorCode.ClerkAccountNotFound]: "Clerk account not found",
  [WorkspaceMemberErrorCode.ClerkAccountIncomplete]:
    "Clerk account has no primary email address",
  [WorkspaceMemberErrorCode.ClerkAccountAlreadyLinked]:
    "Clerk account is already linked to a user",
  [WorkspaceMemberErrorCode.ClerkUnavailable]:
    "Clerk directory is temporarily unavailable",
  [WorkspaceMemberErrorCode.RoleNotAssignable]:
    "At least one role cannot be assigned",
  [WorkspaceMemberErrorCode.OwnerRoleNotAssignable]:
    "The owner role is changed through the owner flow only",
  [WorkspaceMemberErrorCode.MemberWithoutRole]:
    "A member needs at least one role",
  [WorkspaceMemberErrorCode.AlreadyOwner]: "Member is already an owner",
  [WorkspaceMemberErrorCode.NotOwner]: "Member is not an owner",
  [WorkspaceMemberErrorCode.LastActiveOwner]:
    "The last active owner cannot lose the owner role",
  [WorkspaceMemberErrorCode.SelfOwnerRevocation]:
    "Owners cannot revoke their own owner role",
  [WorkspaceMemberErrorCode.MemberAlreadyActive]: "Member is already active",
  [WorkspaceMemberErrorCode.MemberAlreadyInactive]:
    "Member is already inactive",
  [WorkspaceMemberErrorCode.SelfDeactivation]:
    "Members cannot deactivate themselves",
  [WorkspaceMemberErrorCode.MemberHasOpenResponsibilities]:
    "Open responsibilities must be handed over before deactivation",
  [WorkspaceMemberErrorCode.MemberInactive]:
    "Deactivated members cannot become owners",
  [WorkspaceMemberErrorCode.Internal]: "Unexpected server error",
};

export function memberApiError(
  code: WorkspaceMemberErrorCode,
  details?: unknown,
): Response {
  return Response.json(
    {
      error: code,
      message: MESSAGES[code],
      ...(details !== undefined ? { details } : {}),
    },
    { status: STATUS[code] },
  );
}
