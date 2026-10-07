import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import type { FilesViewModel } from "@/common/contracts/crm/files/files-view-model";
import { crmScopeRights } from "@/common/patterns/crm/crm-scope-rights";
import { listWorkspaceMembers } from "@/server/workspace/access/query-handler/list-workspace-members.query-handler";

/**
 * Resolves the file rights of one customer per scope. Returns null when no scope is readable —
 * the files area then does not exist for this actor, not even as an empty section.
 */
export async function buildFilesViewModel(options: {
  actor: WorkspaceActor;
  customerId: string;
  projects: readonly CockpitProjectDto[];
}): Promise<FilesViewModel | null> {
  const { actor, customerId, projects } = options;
  const rights = (permission: Permission) =>
    crmScopeRights.forPermission(actor, permission, customerId, projects);

  const read = rights(Permission.FilesRead);
  if (!crmScopeRights.any(read)) return null;

  const write = rights(Permission.FilesWrite);

  const members = can(actor, Permission.MembersRead)
    ? await listWorkspaceMembers()
    : [];

  return {
    projects: crmScopeRights.projectsFor(read, write, projects),
    read,
    write,
    remove: rights(Permission.FilesDelete),
    members: members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
    })),
  };
}
