import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import type { FilesScopeRights } from "@/common/contracts/crm/files/files-scope-rights";
import type { FilesViewModel } from "@/common/contracts/crm/files/files-view-model";
import { canOn } from "@/common/patterns/auth/can-on";
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
  const rights = (permission: Permission): FilesScopeRights => ({
    customerWide: canOn(actor, permission, { customerId }),
    projectIds: projects
      .filter((project) =>
        canOn(actor, permission, { customerId, projectId: project.id }),
      )
      .map((project) => project.id),
  });

  const read = rights(Permission.FilesRead);
  if (!read.customerWide && read.projectIds.length === 0) return null;

  const write = rights(Permission.FilesWrite);
  // Write-only projects (files.write without files.read) still need to appear as an upload/move
  // target, even though no file of theirs will ever show up in the list.
  const knownProjectIds = new Set([...read.projectIds, ...write.projectIds]);

  const members = can(actor, Permission.MembersRead)
    ? await listWorkspaceMembers()
    : [];

  return {
    projects: projects
      .filter((project) => knownProjectIds.has(project.id))
      .map((project) => ({ id: project.id, title: project.title })),
    read,
    write,
    remove: rights(Permission.FilesDelete),
    members: members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
    })),
  };
}
