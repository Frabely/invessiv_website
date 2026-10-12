import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import type { PortalRequestableServiceDto } from "@invessiv/common/contracts/portal/portal-requestable-service.dto";
import type { PortalServiceRequestDto } from "@invessiv/common/contracts/portal/portal-service-request.dto";
import type { PortalServicesDto } from "@invessiv/common/contracts/portal/portal-services.dto";

export function requestableService(
  overrides: Partial<PortalRequestableServiceDto> = {},
): PortalRequestableServiceDto {
  return {
    id: "service-1",
    title: "Additional page",
    description: "One more page.",
    kind: LineItemKind.Standard,
    projectMode: LineItemProjectMode.ExistingProject,
    projectIds: ["project-1"],
    ...overrides,
  };
}
export function serviceRequest(
  overrides: Partial<PortalServiceRequestDto> = {},
): PortalServiceRequestDto {
  return {
    id: "request-1",
    title: "Additional page",
    note: "",
    kind: LineItemKind.Standard,
    requestedMinutes: null,
    projectWish: ServiceRequestProjectWish.Existing,
    projectTitle: "Relaunch",
    status: ServiceRequestStatus.Requested,
    declineReason: null,
    createdAt: "2026-10-11T08:00:00.000Z",
    canWithdraw: true,
    ...overrides,
  };
}
export function portalServices(
  overrides: Partial<PortalServicesDto> = {},
): PortalServicesDto {
  return {
    services: [requestableService()],
    projects: [{ id: "project-1", title: "Relaunch" }],
    requests: [],
    canRequest: true,
    ...overrides,
  };
}
