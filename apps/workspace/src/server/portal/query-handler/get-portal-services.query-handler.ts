import "server-only";
import { and, asc, desc, inArray, notInArray } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { OPEN_SERVICE_REQUEST_STATUS_VALUES } from "@invessiv/common/constants/crm/service-request-statuses";
import { PortalServiceRequestLimits } from "@invessiv/common/constants/portal/portal-service-request-limits";
import type { PortalServicesDto } from "@invessiv/common/contracts/portal/portal-services.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  lineItemTemplates,
  serviceRequests,
} from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalServiceRequestMappingService } from "@/server/portal/services/service-requests/portal-service-request-mapping-service";
import { portalServiceRequestService as services } from "@/server/portal/services/service-requests/portal-service-request-service";

const requestColumns = {
  id: serviceRequests.id,
  title: serviceRequests.title,
  note: serviceRequests.note,
  kind: serviceRequests.kind,
  requested_minutes: serviceRequests.requested_minutes,
  project_wish: serviceRequests.project_wish,
  requested_project_id: serviceRequests.requested_project_id,
  project_id: serviceRequests.project_id,
  status: serviceRequests.status,
  decline_reason: serviceRequests.decline_reason,
  created_at: serviceRequests.created_at,
};

/**
 * Catalog, project options and the company's newest requests for the dashboard widget and its
 * dialog. Null without `portal.services.read` — the widget then does not exist. The owner view
 * reads the same data and never gets `canRequest`, because it does not hold the request right.
 */
export async function getPortalServices(
  reader: PortalReader,
): Promise<PortalServicesDto | null> {
  if (!services.can(reader, Permission.PortalServicesRead)) return null;

  const db = getDrizzleDatabaseClient();
  const [catalogRows, requestRows, projectRows] = await Promise.all([
    db
      .select({
        id: lineItemTemplates.id,
        title: lineItemTemplates.title,
        portal_description: lineItemTemplates.portal_description,
        kind: lineItemTemplates.kind,
        project_mode: lineItemTemplates.project_mode,
      })
      .from(lineItemTemplates)
      .where(services.catalogCondition())
      .orderBy(asc(lineItemTemplates.title), asc(lineItemTemplates.id)),
    db
      .select(requestColumns)
      .from(serviceRequests)
      .where(
        and(
          services.requestCondition(reader, Permission.PortalServicesRead),
          inArray(serviceRequests.status, OPEN_SERVICE_REQUEST_STATUS_VALUES),
        ),
      )
      // One statement sees one snapshot even when a request is withdrawn during this read.
      .unionAll(
        db
          .select(requestColumns)
          .from(serviceRequests)
          .where(
            and(
              services.requestCondition(reader, Permission.PortalServicesRead),
              notInArray(serviceRequests.status, [
                ...OPEN_SERVICE_REQUEST_STATUS_VALUES,
              ]),
            ),
          )
          .orderBy(desc(serviceRequests.created_at), desc(serviceRequests.id))
          .limit(PortalServiceRequestLimits.HistoryShown),
      )
      .orderBy(desc(serviceRequests.created_at), desc(serviceRequests.id)),
    services.projectCandidates(db, reader, Permission.PortalServicesRead),
  ]);

  const openExtraRoundIds = new Set(
    requestRows.flatMap((row) =>
      row.kind === LineItemKind.FeedbackRound &&
      OPEN_SERVICE_REQUEST_STATUS_VALUES.some(
        (status) => status === row.status,
      ) &&
      row.requested_project_id !== null
        ? [row.requested_project_id]
        : [],
    ),
  );
  const selectableProjects = await services.projectOptionsByKind(
    db,
    projectRows,
    openExtraRoundIds,
    catalogRows.some((row) => row.kind === LineItemKind.FeedbackRound),
  );
  return portalServiceRequestMappingService.toServicesDto({
    catalogRows,
    requestRows,
    selectableProjects,
    canRequest: services.can(reader, Permission.PortalServicesRequest),
  });
}
