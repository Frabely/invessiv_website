import "server-only";

import { and, desc, eq, or } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { CrmProjectOption } from "@/common/contracts/crm/crm-project-option";
import { accessScope, canAnywhere } from "@/common/patterns/auth/access-scope";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import { credentialSchemas } from "../services/credentials/credential-schemas";

/** Minimal project labels for credential scopes, independent of general project read access. */
export async function listCredentialProjectsByCustomer(
  customerId: string,
  actor: WorkspaceActor,
): Promise<CrmProjectOption[]> {
  if (!credentialSchemas.id.safeParse(customerId).success) return [];
  if (
    !canAnywhere(actor, Permission.CredentialsRead) &&
    !canAnywhere(actor, Permission.CredentialsWrite)
  )
    return [];

  const columns = { customerId: projects.customer_id, projectId: projects.id };
  const readable = crmAccessCondition.forScope(
    accessScope(actor, Permission.CredentialsRead),
    columns,
  );
  const writable = crmAccessCondition.forScope(
    accessScope(actor, Permission.CredentialsWrite),
    columns,
  );

  return getDrizzleDatabaseClient()
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(
      and(
        eq(projects.customer_id, customerId),
        // An undefined condition is an unrestricted scope, so its union is unrestricted too.
        readable === undefined || writable === undefined
          ? undefined
          : or(readable, writable),
      ),
    )
    .orderBy(desc(projects.created_at));
}
