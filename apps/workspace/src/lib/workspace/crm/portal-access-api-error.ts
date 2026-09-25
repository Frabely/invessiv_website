import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

const STATUS: Record<PortalAccessErrorCode, HttpResponseCode> = {
  [PortalAccessErrorCode.CustomerNotFound]: HttpResponseCode.NotFound,
  [PortalAccessErrorCode.AssignmentNotFound]: HttpResponseCode.NotFound,
  [PortalAccessErrorCode.PreviewNotConfirmed]: HttpResponseCode.Conflict,
  [PortalAccessErrorCode.MembershipAlreadyActive]: HttpResponseCode.Conflict,
  [PortalAccessErrorCode.InvalidPortalRole]: HttpResponseCode.BadRequest,
  [PortalAccessErrorCode.ValidationError]: HttpResponseCode.BadRequest,
  [PortalAccessErrorCode.NotFound]: HttpResponseCode.NotFound,
  [PortalAccessErrorCode.InvalidRoles]: HttpResponseCode.BadRequest,
  [PortalAccessErrorCode.Unavailable]: HttpResponseCode.ServiceUnavailable,
};

const MESSAGES: Record<PortalAccessErrorCode, string> = {
  [PortalAccessErrorCode.CustomerNotFound]: "Customer not found",
  [PortalAccessErrorCode.AssignmentNotFound]: "Contact assignment not found",
  [PortalAccessErrorCode.PreviewNotConfirmed]:
    "The portal preview has not been confirmed yet",
  [PortalAccessErrorCode.MembershipAlreadyActive]:
    "This contact already has active portal access",
  [PortalAccessErrorCode.InvalidPortalRole]:
    "The selected role is not a valid portal role",
  [PortalAccessErrorCode.ValidationError]: "Validation failed",
  [PortalAccessErrorCode.NotFound]: "Not found",
  [PortalAccessErrorCode.InvalidRoles]:
    "One or more selected roles are not active portal roles",
  [PortalAccessErrorCode.Unavailable]:
    "Portal access is temporarily unavailable",
};

export function portalAccessApiError(code: PortalAccessErrorCode): Response {
  return Response.json(
    { error: code, message: MESSAGES[code] },
    { status: STATUS[code] },
  );
}
