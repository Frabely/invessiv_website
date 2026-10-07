import type { CrmProjectOption } from "@/common/contracts/crm/crm-project-option";
import type { CrmScopeRights } from "@/common/contracts/crm/crm-scope-rights";
import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";

function forPermission(
  actor: WorkspaceActor,
  permission: Permission,
  customerId: string,
  projects: readonly CrmProjectOption[],
): CrmScopeRights {
  return {
    customerWide: canOn(actor, permission, { customerId }),
    projectIds: projects
      .filter((project) =>
        canOn(actor, permission, { customerId, projectId: project.id }),
      )
      .map((project) => project.id),
  };
}

/** Write-only projects remain available as targets without making their entries readable. */
function projectsFor(
  read: CrmScopeRights,
  write: CrmScopeRights,
  projects: readonly CrmProjectOption[],
): CrmProjectOption[] {
  const knownIds = new Set([...read.projectIds, ...write.projectIds]);
  return projects
    .filter((project) => knownIds.has(project.id))
    .map((project) => ({ id: project.id, title: project.title }));
}

/** Null is the customer-wide scope; a project grant never opens it. */
function allows(rights: CrmScopeRights, projectId: string | null): boolean {
  return projectId === null
    ? rights.customerWide
    : rights.projectIds.includes(projectId);
}

/** Targets a new or moved entry may go to, customer-wide first; null stands for customer-wide. */
function targets(
  rights: CrmScopeRights,
  projects: readonly CrmProjectOption[],
): (string | null)[] {
  return [
    ...(rights.customerWide ? [null] : []),
    ...projects
      .filter((project) => rights.projectIds.includes(project.id))
      .map((project) => project.id),
  ];
}

function any(rights: CrmScopeRights): boolean {
  return rights.customerWide || rights.projectIds.length > 0;
}

export const crmScopeRights = {
  forPermission,
  projectsFor,
  allows,
  targets,
  any,
};
