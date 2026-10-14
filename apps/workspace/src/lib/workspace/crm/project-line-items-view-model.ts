import "server-only";
import { listLineItemAssignmentProjects } from "@/server/workspace/crm/query-handler/list-line-item-assignment-projects.query-handler";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { calculateProjectLineItemValue } from "@invessiv/common/patterns/crm/project-line-item-value";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import type { ProjectLineItemsViewModel } from "@/common/contracts/crm/project-line-items-view-model";
import { canOn } from "@/common/patterns/auth/can-on";
import { listAssignableLineItemTemplates } from "@/server/workspace/crm/query-handler/list-assignable-line-item-templates.query-handler";
import { listProjectLineItemsByCustomer } from "@/server/workspace/crm/query-handler/list-project-line-items-by-customer.query-handler";

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

  const writableProjects = projects.filter((project) =>
    canOn(actor, Permission.ProjectLineItemsWrite, {
      customerId,
      projectId: project.id,
    }),
  );
  const writableProjectIds = writableProjects.map((project) => project.id);

  // The picker only ever offers active templates, and only catalog readers may receive them.
  // A project-scoped write grant must not disclose the workspace-wide catalog.
  const [services, assignableTemplates, assignment] = await Promise.all([
    listProjectLineItemsByCustomer(customerId, actor),
    writableProjectIds.length > 0 &&
    can(actor, Permission.LineItemTemplatesRead)
      ? listAssignableLineItemTemplates()
      : Promise.resolve([]),
    writableProjectIds.length > 0
      ? listLineItemAssignmentProjects(customerId, actor)
      : Promise.resolve({ blockers: {} }),
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
    assignableTemplates,
    assignmentBlockersByProjectId: assignment.blockers,
    catalogHref,
    customerValue: calculateProjectLineItemValue(services),
    valuesByProjectId,
  };
}
