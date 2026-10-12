import { SERVICE_REQUEST_TRANSITIONS } from "@invessiv/common/constants/crm/service-request-transitions";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import type { ServiceRequestTransitionSide } from "@invessiv/common/constants/crm/service-request-transition-sides";
/** Before an offer the customer knows no price, so accepting then needs a deliberate confirmation. */
export function isServiceRequestWithoutOffer(
  status: ServiceRequestStatus,
): boolean {
  return status === ServiceRequestStatus.Requested;
}
export function canTransitionServiceRequest(
  from: ServiceRequestStatus,
  to: ServiceRequestStatus,
  side: ServiceRequestTransitionSide,
): boolean {
  return SERVICE_REQUEST_TRANSITIONS.some(
    (step) => step.from === from && step.to === to && step.side === side,
  );
}
