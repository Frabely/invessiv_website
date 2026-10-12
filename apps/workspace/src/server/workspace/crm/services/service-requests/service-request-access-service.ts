import "server-only";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import {
  OPEN_SERVICE_REQUEST_STATUS_VALUES,
  ServiceRequestStatus,
} from "@invessiv/common/constants/crm/service-request-statuses";
import type { ServiceRequestRow } from "@invessiv/common/contracts/crm/rows/service-request-row";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type {
  ContactDatabaseReader,
  ContactDatabaseTransaction,
} from "@invessiv/db/core";
import {
  serviceRequests,
  customers,
  projects,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import { loadPortalContactNames } from "@/server/shared/services/load-portal-contact-names";
import { serviceRequestMappingService } from "./service-request-mapping-service";
import type { ServiceRequestListFilter } from "./service-request-types";
const requestedProjects = alias(projects, "service_request_requested_project");

function condition(
  actor: WorkspaceActor,
  permission: Permission = Permission.ServiceRequestsRead,
) {
  return crmAccessCondition.forScope(accessScope(actor, permission), {
    customerId: serviceRequests.customer_id,
  });
}
function inboxCondition(actor: WorkspaceActor, openOnly: boolean) {
  return and(
    condition(actor),
    openOnly
      ? inArray(serviceRequests.status, OPEN_SERVICE_REQUEST_STATUS_VALUES)
      : undefined,
  );
}
async function lock(
  tx: ContactDatabaseTransaction,
  id: string,
  actor: WorkspaceActor,
): Promise<ServiceRequestRow | null> {
  const [row] = await tx
    .select()
    .from(serviceRequests)
    .where(
      and(
        eq(serviceRequests.id, id),
        condition(actor, Permission.ServiceRequestsWrite),
      ),
    )
    .limit(1)
    .for("update");
  return row ?? null;
}
async function list(
  executor: ContactDatabaseReader,
  actor: WorkspaceActor,
  {
    customerId,
    openOnly = false,
    requestId,
    window,
  }: ServiceRequestListFilter = {},
): Promise<ServiceRequestDto[]> {
  const query = executor
    .select({
      request: serviceRequests,
      customerDisplayName: customers.display_name,
      customerNumber: customers.customer_number,
      requestedProjectTitle: requestedProjects.title,
    })
    .from(serviceRequests)
    .innerJoin(customers, eq(customers.id, serviceRequests.customer_id))
    .leftJoin(
      requestedProjects,
      and(
        eq(requestedProjects.id, serviceRequests.requested_project_id),
        crmAccessCondition.forScope(
          accessScope(actor, Permission.ProjectsRead),
          {
            customerId: requestedProjects.customer_id,
            projectId: requestedProjects.id,
          },
        ),
      ),
    )
    .where(
      and(
        inboxCondition(actor, openOnly),
        customerId ? eq(serviceRequests.customer_id, customerId) : undefined,
        requestId ? eq(serviceRequests.id, requestId) : undefined,
      ),
    )
    .orderBy(
      sql`case when ${serviceRequests.status} in (${ServiceRequestStatus.Requested},${ServiceRequestStatus.Offered}) then 0 else 1 end`,
      desc(serviceRequests.created_at),
      desc(serviceRequests.id),
    );
  const rows = await (window
    ? query.limit(window.limit).offset(window.offset)
    : query);
  const names = await loadPortalContactNames(
    executor,
    rows.map((r) => r.request.requested_by_membership_id),
  );
  return rows.map((row) =>
    serviceRequestMappingService.toDto(
      row,
      names.get(row.request.requested_by_membership_id) ?? "",
    ),
  );
}
async function toDto(
  executor: ContactDatabaseReader,
  row: ServiceRequestRow,
  actor: WorkspaceActor,
): Promise<ServiceRequestDto> {
  // Mutation responses use write scope: writers need not also hold the independent read permission.
  const [customer] = await executor
    .select({
      customerDisplayName: customers.display_name,
      customerNumber: customers.customer_number,
    })
    .from(customers)
    .where(eq(customers.id, row.customer_id))
    .limit(1);
  if (!customer) throw new Error("Service request customer disappeared");
  const [project] = row.requested_project_id
    ? await executor
        .select({ title: projects.title })
        .from(projects)
        .where(
          and(
            eq(projects.id, row.requested_project_id),
            crmAccessCondition.forScope(
              accessScope(actor, Permission.ProjectsRead),
              { customerId: projects.customer_id, projectId: projects.id },
            ),
          ),
        )
        .limit(1)
    : [];
  const names = await loadPortalContactNames(executor, [
    row.requested_by_membership_id,
  ]);
  return serviceRequestMappingService.toDto(
    {
      request: row,
      ...customer,
      requestedProjectTitle: project?.title ?? null,
    },
    names.get(row.requested_by_membership_id) ?? "",
  );
}
/** Open means unanswered by either side: an offer waiting for the customer still needs a follow-up. */
async function countOpen(
  executor: ContactDatabaseReader,
  actor: WorkspaceActor,
): Promise<number> {
  return countInbox(executor, actor, true);
}
/** Counts what `list` returns for the same filter, so the inbox can page. */
async function countInbox(
  executor: ContactDatabaseReader,
  actor: WorkspaceActor,
  openOnly: boolean,
): Promise<number> {
  const [row] = await executor
    .select({ value: count() })
    .from(serviceRequests)
    .where(inboxCondition(actor, openOnly));
  return row?.value ?? 0;
}
async function hasRequests(
  executor: ContactDatabaseReader,
  actor: WorkspaceActor,
): Promise<boolean> {
  const [row] = await executor
    .select({ id: serviceRequests.id })
    .from(serviceRequests)
    .where(condition(actor))
    .limit(1);
  return !!row;
}
export const serviceRequestAccessService = {
  condition,
  lock,
  list,
  toDto,
  countOpen,
  countInbox,
  hasRequests,
} as const;
