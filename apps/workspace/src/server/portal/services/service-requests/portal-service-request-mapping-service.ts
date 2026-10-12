import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestTransitionSide } from "@invessiv/common/constants/crm/service-request-transition-sides";
import type { PortalRequestableServiceDto } from "@invessiv/common/contracts/portal/portal-requestable-service.dto";
import type { PortalServiceRequestDto } from "@invessiv/common/contracts/portal/portal-service-request.dto";
import type { PortalServicesDto } from "@invessiv/common/contracts/portal/portal-services.dto";
import { canTransitionServiceRequest } from "@invessiv/common/patterns/crm/service-request-state";
import { listPortalServiceProjectWishes } from "@/common/patterns/portal/portal-service-project-wishes";
import type {
  PortalSelectableProjectsByKind,
  PortalServiceCatalogRow,
  PortalServiceRequestReadRow,
  PortalServicesSource,
} from "./portal-service-request-types";

type PortalServiceRequestView = {
  /** Titles of the projects the portal shows; a request on any other project names none. */
  projectTitles: ReadonlyMap<string, string>;
  canRequest: boolean;
};

/** Rows written before Task 74 carry NULL in the newer columns; NULL reads as the plain value. */
function toServiceDto(
  row: PortalServiceCatalogRow,
  selectableProjects: PortalSelectableProjectsByKind,
): PortalRequestableServiceDto {
  const kind = row.kind ?? LineItemKind.Standard;
  const projectMode = row.project_mode ?? LineItemProjectMode.ExistingProject;
  return {
    id: row.id,
    title: row.title,
    description: row.portal_description ?? "",
    kind,
    projectMode,
    projectIds:
      projectMode === LineItemProjectMode.NewProject
        ? []
        : selectableProjects[kind].map((project) => project.id),
  };
}

function toRequestDto(
  row: PortalServiceRequestReadRow,
  view: PortalServiceRequestView,
): PortalServiceRequestDto {
  const projectId = row.project_id ?? row.requested_project_id;
  return {
    id: row.id,
    title: row.title,
    note: row.note,
    kind: row.kind,
    requestedMinutes: row.requested_minutes,
    projectWish: row.project_wish,
    projectTitle:
      projectId === null ? null : (view.projectTitles.get(projectId) ?? null),
    status: row.status,
    declineReason:
      row.status === ServiceRequestStatus.Declined ? row.decline_reason : null,
    createdAt: row.created_at.toISOString(),
    canWithdraw:
      view.canRequest &&
      canTransitionServiceRequest(
        row.status,
        ServiceRequestStatus.Withdrawn,
        ServiceRequestTransitionSide.Customer,
      ),
  };
}

/**
 * A service with no possible answer to the project question is not offered at all: that is a
 * further feedback round while no project can take one.
 */
function isOfferable(service: PortalRequestableServiceDto): boolean {
  return (
    listPortalServiceProjectWishes({
      service,
      selectableProjectCount: service.projectIds.length,
    }).length > 0
  );
}

function toServicesDto(source: PortalServicesSource): PortalServicesDto {
  const projects = source.selectableProjects[LineItemKind.Standard];
  const view: PortalServiceRequestView = {
    projectTitles: new Map(
      projects.map((project) => [project.id, project.title]),
    ),
    canRequest: source.canRequest,
  };
  return {
    services: source.catalogRows
      .map((row) => toServiceDto(row, source.selectableProjects))
      .filter(isOfferable),
    projects: projects.map((project) => ({ ...project })),
    requests: source.requestRows.map((row) => toRequestDto(row, view)),
    canRequest: source.canRequest,
  };
}

/** The only place a portal service DTO is built; nothing here ever reads a price column. */
export const portalServiceRequestMappingService = {
  toServiceDto,
  toRequestDto,
  toServicesDto,
} as const;
