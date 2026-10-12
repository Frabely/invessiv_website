import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import type { PortalRequestableServiceDto } from "@invessiv/common/contracts/portal/portal-requestable-service.dto";
import type { PortalServicesDto } from "@invessiv/common/contracts/portal/portal-services.dto";

/**
 * The further feedback round a reader can request for this project right now, if any. The server
 * already left out projects that cannot take a round or have one requested; without the request
 * right there is nothing to link to.
 */
export function findPortalExtraRoundService(
  services: PortalServicesDto | null,
  projectId: string,
): PortalRequestableServiceDto | null {
  if (!services?.canRequest) return null;
  return (
    services.services.find(
      (service) =>
        service.kind === LineItemKind.FeedbackRound &&
        service.projectIds.includes(projectId),
    ) ?? null
  );
}
