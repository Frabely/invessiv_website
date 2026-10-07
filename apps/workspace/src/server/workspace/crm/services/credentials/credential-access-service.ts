import "server-only";
import { crmTargetExists } from "../crm-target-exists";
import { and, eq, sql } from "drizzle-orm";
import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { customerCredentials } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import type { CredentialRow } from "./credential-types";

/** Everything a list may read. Neither ciphertext column is part of it. */
const metadataColumns = {
  id: customerCredentials.id,
  customer_id: customerCredentials.customer_id,
  project_id: customerCredentials.project_id,
  title: customerCredentials.title,
  credential_type: customerCredentials.credential_type,
  url: customerCredentials.url,
  username: customerCredentials.username,
  has_note: sql<boolean>`${customerCredentials.note_ciphertext} is not null`,
  visible_to_customer: customerCredentials.visible_to_customer,
  created_by_side: customerCredentials.created_by_side,
  created_by_member_id: customerCredentials.created_by_member_id,
  created_by_portal_membership_id:
    customerCredentials.created_by_portal_membership_id,
  secret_changed_at: customerCredentials.secret_changed_at,
  last_revealed_at: customerCredentials.last_revealed_at,
  version: customerCredentials.version,
  created_at: customerCredentials.created_at,
  updated_at: customerCredentials.updated_at,
};

function condition(actor: WorkspaceActor, permission: Permission) {
  return crmAccessCondition.forScope(accessScope(actor, permission), {
    customerId: customerCredentials.customer_id,
    projectId: customerCredentials.project_id,
  });
}

/** The full row including both ciphertexts, locked. Null outside the actor's scope. */
async function lock(
  tx: ContactDatabaseTransaction,
  id: string,
  actor: WorkspaceActor,
  permission: Permission,
): Promise<CredentialRow | null> {
  const [row] = await tx
    .select()
    .from(customerCredentials)
    .where(and(eq(customerCredentials.id, id), condition(actor, permission)))
    .limit(1)
    .for("update");
  if (
    !row ||
    !canOn(actor, permission, {
      customerId: row.customer_id,
      projectId: row.project_id ?? undefined,
    })
  )
    return null;
  return row;
}

export const credentialAccessService = {
  metadataColumns,
  condition,
  targetExists: crmTargetExists,
  lock,
};
