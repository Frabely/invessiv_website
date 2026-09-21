import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { ProjectLineItemsViewModel } from "@/common/contracts/crm/project-line-items-view-model";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import { canOn } from "@/common/patterns/auth/can-on";
import { listProjectLineItemsByCustomer } from "@/server/workspace/crm/query-handler/list-project-line-items-by-customer.query-handler";
import { listLineItemTemplates } from "@/server/workspace/crm/query-handler/list-line-item-templates.query-handler";
import { calculateProjectLineItemValue } from "@/common/patterns/crm/project-line-item-value";

/**
 * Collects the services of a customer's projects together with the per-project rights, so the
 * cockpit can decide what to show without asking the server again when it switches projects.
 * Returns null when no project of this customer is readable — the area then stays hidden.
 */
export async function buildProjectLineItemsViewModel(options: {
  actor: WorkspaceActor;
  catalogHref: string | null;
  customerId: string;
  projects: readonly CockpitProjectDto[];
}): Promise<ProjectLineItemsViewModel | null> {
  const { actor, catalogHref, customerId, projects } = options;
  const readableProjectIds = projects
    .filter((project) =>
      canOn(actor, Permission.ProjectLineItemsRead, {
        customerId,
        projectId: project.id,
      }),
    )
    .map((project) => project.id);
  if (readableProjectIds.length === 0) return null;

  const writableProjectIds = projects
    .filter((project) =>
      canOn(actor, Permission.ProjectLineItemsWrite, {
        customerId,
        projectId: project.id,
      }),
    )
    .map((project) => project.id);

  // The picker only ever offers active templates, and only catalog readers may receive them.
  // A project-scoped write grant must not disclose the workspace-wide catalog.
  const [services, catalog] = await Promise.all([
    listProjectLineItemsByCustomer(customerId, actor),
    writableProjectIds.length > 0 &&
    can(actor, Permission.LineItemTemplatesRead)
      ? listLineItemTemplates({ includeArchived: false })
      : null,
  ]);
  const valuesByProjectId = Object.fromEntries(
    readableProjectIds.map((projectId) => [
      projectId,
      calculateProjectLineItemValue(
        services.filter((service) => service.projectId === projectId),
      ),
    ]),
  );

  return {
    services,
    readableProjectIds,
    writableProjectIds,
    assignableTemplates: catalog?.rows ?? [],
    catalogHref,
    customerValue: calculateProjectLineItemValue(services),
    valuesByProjectId,
  };
}
