import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { CredentialsProjectOption } from "@/common/contracts/crm/credentials/credentials-project-option";
import type { CredentialsScopeRights } from "@/common/contracts/crm/credentials/credentials-scope-rights";
import type { CredentialsViewModel } from "@/common/contracts/crm/credentials/credentials-view-model";
import { canOn } from "@/common/patterns/auth/can-on";
import { credentialCryptoService } from "@/server/shared/services/credential/credential-crypto-service";

/**
 * Resolves the credential rights of one customer per scope. Returns null when no scope is
 * readable — the area then does not exist for this actor, not even as an empty section.
 */
export function buildCredentialsViewModel(options: {
  actor: WorkspaceActor;
  customerId: string;
  projects: readonly CredentialsProjectOption[];
}): CredentialsViewModel | null {
  const { actor, customerId, projects } = options;
  const rights = (permission: Permission): CredentialsScopeRights => ({
    customerWide: canOn(actor, permission, { customerId }),
    projectIds: projects
      .filter((project) =>
        canOn(actor, permission, { customerId, projectId: project.id }),
      )
      .map((project) => project.id),
  });

  const read = rights(Permission.CredentialsRead);
  if (!read.customerWide && read.projectIds.length === 0) return null;

  const write = rights(Permission.CredentialsWrite);
  // A write-only project still has to appear as a target for new or moved entries.
  const knownProjectIds = new Set([...read.projectIds, ...write.projectIds]);

  return {
    projects: projects
      .filter((project) => knownProjectIds.has(project.id))
      .map((project) => ({ id: project.id, title: project.title })),
    read,
    write,
    reveal: rights(Permission.CredentialsReveal),
    configured: credentialCryptoService.isConfigured(),
  };
}
