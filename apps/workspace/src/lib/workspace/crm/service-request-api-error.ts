import "server-only";
import { ServiceRequestErrorCode as E } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import type { ChangeServiceRequestStatusResult } from "@invessiv/common/contracts/crm/results/change-service-request-status-result";
import type { CrmOperation } from "@/common/constants/crm/crm-operations";
import { privateResponse } from "@/lib/http/private-no-store";
import { logCrmFailure } from "./log-crm-failure";
const STATUS: Record<E, H> = {
  [E.ServiceRequestNotFound]: H.NotFound,
  [E.ValidationError]: H.UnprocessableContent,
  [E.InvalidTransition]: H.Conflict,
  [E.VersionConflict]: H.Conflict,
  [E.OfferRequired]: H.Conflict,
  [E.CatalogNotReadable]: H.Forbidden,
  [E.KindMismatch]: H.UnprocessableContent,
  [E.TemplateNotAssignable]: H.Conflict,
  [E.ProjectNotFound]: H.NotFound,
  [E.EffectNotPermitted]: H.Forbidden,
  [E.ProjectClosed]: H.Conflict,
  [E.FeedbackRoundNotAvailable]: H.Conflict,
  [E.Internal]: H.InternalServerError,
};
const MESSAGES: Record<E, string> = {
  [E.ServiceRequestNotFound]: "Service request not found",
  [E.ValidationError]: "Validation failed",
  [E.InvalidTransition]: "Transition not allowed",
  [E.VersionConflict]: "Request changed",
  [E.OfferRequired]: "Acceptance without offer not confirmed",
  [E.CatalogNotReadable]: "Catalog not readable",
  [E.KindMismatch]: "Template kind does not match request",
  [E.TemplateNotAssignable]: "Template not assignable",
  [E.ProjectNotFound]: "Project not found",
  [E.EffectNotPermitted]: "Assignment effect not permitted",
  [E.ProjectClosed]: "Project is closed",
  [E.FeedbackRoundNotAvailable]: "Feedback round unavailable",
  [E.Internal]: "Unexpected server error",
};
export function serviceRequestApiError(code: E): Response {
  return Response.json(
    { error: code, message: MESSAGES[code] },
    { status: STATUS[code] },
  );
}
export function serviceRequestResponse(
  result: ChangeServiceRequestStatusResult,
): Response {
  if (result.ok) return Response.json(result.request, { status: H.Ok });
  if (result.conflict)
    return Response.json(result.conflict, { status: H.Conflict });
  return serviceRequestApiError(result.code);
}
export function privateServiceRequestResponse(
  operation: CrmOperation,
  run: () => Promise<Response>,
): Promise<Response> {
  return privateResponse(run, (error) => {
    logCrmFailure(operation, error);
    return serviceRequestApiError(E.Internal);
  });
}
