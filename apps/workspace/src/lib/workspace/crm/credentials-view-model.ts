import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { CrmProjectOption } from "@/common/contracts/crm/crm-project-option";
import type { CredentialsViewModel } from "@/common/contracts/crm/credentials/credentials-view-model";
import { crmScopeRights } from "@/common/patterns/crm/crm-scope-rights";
import { credentialCryptoService } from "@/server/shared/services/credential/credential-crypto-service";

/**
 * Resolves the credential rights of one customer per scope. Returns null when no scope is
 * readable — the area then does not exist for this actor, not even as an empty section.
 */
export function buildCredentialsViewModel(options: {
  actor: WorkspaceActor;
  customerId: string;
  projects: readonly CrmProjectOption[];
}): CredentialsViewModel | null {
  const { actor, customerId, projects } = options;
  const rights = (permission: Permission) =>
    crmScopeRights.forPermission(actor, permission, customerId, projects);

  const read = rights(Permission.CredentialsRead);
  if (!crmScopeRights.any(read)) return null;

  const write = rights(Permission.CredentialsWrite);

  return {
    projects: crmScopeRights.projectsFor(read, write, projects),
    read,
    write,
    reveal: rights(Permission.CredentialsReveal),
    configured: credentialCryptoService.isConfigured(),
  };
}
