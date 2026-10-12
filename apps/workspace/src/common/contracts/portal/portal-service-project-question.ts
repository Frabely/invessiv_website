import type { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import type { PortalServiceProjectOptionDto } from "@invessiv/common/contracts/portal/portal-service-project-option.dto";

/** What the form asks about the project for one service, already decided for the contact. */
export interface PortalServiceProjectQuestion {
  /** Answers the service allows, in the order the form offers them. */
  wishes: readonly ServiceRequestProjectWish[];
  /** Projects offered when `existing` is among the wishes. */
  projects: readonly PortalServiceProjectOptionDto[];
  /** False when there is exactly one possible answer: the form then states it instead of asking. */
  asks: boolean;
}
