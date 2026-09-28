import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import type { FilesScopeRights } from "@/common/contracts/crm/files/files-scope-rights";

/** Null is the customer-wide scope; a project grant never opens it. */
function allows(rights: FilesScopeRights, projectId: string | null): boolean {
  return projectId === null
    ? rights.customerWide
    : rights.projectIds.includes(projectId);
}

/** Targets a new or moved entry may go to, customer-wide first; null stands for customer-wide. */
function targets(
  rights: FilesScopeRights,
  projects: readonly FilesProjectOption[],
): (string | null)[] {
  return [
    ...(rights.customerWide ? [null] : []),
    ...projects
      .filter((project) => rights.projectIds.includes(project.id))
      .map((project) => project.id),
  ];
}

function any(rights: FilesScopeRights): boolean {
  return rights.customerWide || rights.projectIds.length > 0;
}

export const filesScopeRights = { allows, targets, any };
