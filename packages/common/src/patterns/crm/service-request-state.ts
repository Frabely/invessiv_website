import { SERVICE_REQUEST_TRANSITIONS } from "@invessiv/common/constants/crm/service-request-transitions";
import type { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import type { ServiceRequestTransitionSide } from "@invessiv/common/constants/crm/service-request-transition-sides";
export function canTransitionServiceRequest(
  from: ServiceRequestStatus,
  to: ServiceRequestStatus,
  side: ServiceRequestTransitionSide,
): boolean {
  return SERVICE_REQUEST_TRANSITIONS.some(
    (step) => step.from === from && step.to === to && step.side === side,
  );
}
