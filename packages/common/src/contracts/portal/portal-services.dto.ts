import type { PortalRequestableServiceDto } from "./portal-requestable-service.dto";
import type { PortalServiceProjectOptionDto } from "./portal-service-project-option.dto";
import type { PortalServiceRequestDto } from "./portal-service-request.dto";

/** What the service request widget and its dialog know; loaded together with the dashboard. */
export interface PortalServicesDto {
  /** Active catalog entries released for the portal, by title. Empty until the team releases one; free text stays possible. */
  services: PortalRequestableServiceDto[];
  /** Portal-visible projects of the company a free-text request may name; every `projectIds` entry of a service points into this list. */
  projects: PortalServiceProjectOptionDto[];
  /** Every open request and the newest closed requests capped at `PortalServiceRequestLimits.HistoryShown`, newest first. */
  requests: PortalServiceRequestDto[];
  /** True with `portal.services.request`; never in the owner view, which only reads. */
  canRequest: boolean;
}
