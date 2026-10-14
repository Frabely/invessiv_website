import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { ServiceRequestsViewModel } from "@/common/contracts/crm/service-requests-view-model";
import { canOn } from "@/common/patterns/auth/can-on";
import { createDefaultProcessPlan } from "@/common/patterns/crm/project-process-plan";
import type { Locale } from "@/config/i18n";
import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { listCustomerServiceRequests } from "@/server/workspace/crm/query-handler/list-customer-service-requests.query-handler";
import { listAssignableLineItemTemplates } from "@/server/workspace/crm/query-handler/list-assignable-line-item-templates.query-handler";
import { listLineItemAssignmentProjects } from "@/server/workspace/crm/query-handler/list-line-item-assignment-projects.query-handler";
export async function buildServiceRequestsViewModel(
  actor: WorkspaceActor,
  customerId: string,
  locale: Locale,
  selectedRequestId: string | null = null,
): Promise<ServiceRequestsViewModel | null> {
  if (!canOn(actor, Permission.ServiceRequestsRead, { customerId }))
    return null;
  const requests = await listCustomerServiceRequests(customerId, actor);
  if (requests.length === 0) return null;
  const canWrite = canOn(actor, Permission.ServiceRequestsWrite, {
    customerId,
  });
  const canReadTemplates = can(actor, Permission.LineItemTemplatesRead);
  const [templates, assignment] = await Promise.all([
    canWrite && canReadTemplates
      ? listAssignableLineItemTemplates()
      : Promise.resolve([]),
    canWrite
      ? listLineItemAssignmentProjects(customerId, actor)
      : Promise.resolve({ projects: [], blockers: {} }),
  ]);
  const phases = getCrmCockpitDictionary(locale).projects.phases;
  return {
    requests,
    canWrite,
    canCreateProject:
      canWrite &&
      canOn(actor, Permission.ProjectsWrite, { customerId }) &&
      canOn(actor, Permission.ProjectLineItemsWrite, { customerId }),
    canCreateTemplate:
      canWrite && can(actor, Permission.LineItemTemplatesWrite),
    canReadTemplates,
    projects: assignment.projects,
    blockers: assignment.blockers,
    templates,
    defaultPlan: createDefaultProcessPlan((phase) => phases[phase]),
    selectedRequestId: requests.some((r) => r.id === selectedRequestId)
      ? selectedRequestId
      : null,
  };
}
