import "server-only";
import { and, eq, exists, isNull, or, sql, type SQL } from "drizzle-orm";
import type { Permission } from "@invessiv/common/constants/auth/permissions";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  customerCredentials,
  projects,
} from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";
import type { CredentialRow } from "@/server/shared/services/credential/credential-row-types";
import { portalCredentialSchemas } from "./portal-credential-schemas";

/** Everything the portal list may read. Neither ciphertext column is part of it. */
const metadataColumns = {
  id: customerCredentials.id,
  project_id: customerCredentials.project_id,
  title: customerCredentials.title,
  credential_type: customerCredentials.credential_type,
  url: customerCredentials.url,
  username: customerCredentials.username,
  has_note: sql<boolean>`${customerCredentials.note_ciphertext} is not null`,
  created_by_side: customerCredentials.created_by_side,
  secret_changed_at: customerCredentials.secret_changed_at,
  version: customerCredentials.version,
};

/**
 * The single definition of "this entry is visible in the portal": the reader's own company,
 * released, and either company-wide or on a project the portal shows. `permission` is the right of
 * the action at hand (read, reveal or write); without it the condition is `FALSE`, so a missing
 * right, a foreign company, a guessed id and an unreleased entry all look the same: absent.
 */
function visibleCondition(reader: PortalReader, permission: Permission): SQL {
  return and(
    portalAccessCondition.forReader(reader, permission, {
      customerId: customerCredentials.customer_id,
    }),
    eq(customerCredentials.visible_to_customer, true),
    or(
      isNull(customerCredentials.project_id),
      exists(
        getDrizzleDatabaseClient()
          .select({ id: projects.id })
          .from(projects)
          .where(
            and(
              eq(projects.id, customerCredentials.project_id),
              portalProjectCondition(reader, permission),
            ),
          ),
      ),
    ),
  )!;
}

/** Company-wide check for a right; an owner view never holds reveal or write. */
function can(reader: PortalReader, permission: Permission): boolean {
  return portalCanOn.forReader(reader, permission, {
    customerId: reader.customerId,
  });
}

/** The full row including both ciphertexts, locked. Null for everything the actor may not reach. */
async function lockVisible(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  id: string,
  permission: Permission,
): Promise<CredentialRow | null> {
  if (!portalCredentialSchemas.id.safeParse(id).success) return null;
  const [row] = await tx
    .select()
    .from(customerCredentials)
    .where(
      and(eq(customerCredentials.id, id), visibleCondition(actor, permission)),
    )
    .limit(1)
    .for("update", { of: customerCredentials });
  return row ?? null;
}

/** "General" needs no check; a project must be one the portal shows for the actor's company. */
async function targetExists(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  projectId: string | null,
  permission: Permission,
): Promise<boolean> {
  if (!projectId) return true;
  const [row] = await tx
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        portalProjectCondition(actor, permission),
      ),
    )
    .limit(1)
    .for("share");
  return !!row;
}

export const portalCredentialService = {
  metadataColumns,
  visibleCondition,
  can,
  lockVisible,
  targetExists,
};
