import "server-only";
import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { CredentialListDto } from "@invessiv/common/contracts/credentials/credential-list.dto";
import type { CredentialResult } from "@invessiv/common/contracts/credentials/credential-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerCredentials } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { credentialAccessService } from "../services/credentials/credential-access-service";
import { credentialMappingService } from "../services/credentials/credential-mapping-service";
import { credentialSchemas } from "../services/credentials/credential-schemas";

/** Customer-wide credentials apply to every project and stay in a project view. */
function projectFilterCondition(projectId: string | null | undefined) {
  if (projectId === undefined) return undefined;
  const customerWide = isNull(customerCredentials.project_id);
  if (projectId === null) return customerWide;
  return or(customerWide, eq(customerCredentials.project_id, projectId));
}

/**
 * Metadata only: neither ciphertext is selected and nothing is decrypted. A customer outside the
 * actor's scope yields an empty list, exactly like a customer without credentials.
 */
export async function listCustomerCredentials(
  customerId: string,
  input: { projectId?: string | null },
  actor: WorkspaceActor,
): Promise<CredentialResult<CredentialListDto>> {
  if (!credentialSchemas.id.safeParse(customerId).success)
    return { ok: false, code: E.NotFound };
  const parsed = credentialSchemas.list.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const { projectId } = parsed.data;
  const rows = await getDrizzleDatabaseClient()
    .select(credentialAccessService.metadataColumns)
    .from(customerCredentials)
    .where(
      and(
        eq(customerCredentials.customer_id, customerId),
        credentialAccessService.condition(actor, Permission.CredentialsRead),
        projectFilterCondition(projectId),
      ),
    )
    .orderBy(
      sql`${customerCredentials.project_id} asc nulls first`,
      asc(customerCredentials.credential_type),
      asc(customerCredentials.title),
    );
  return {
    ok: true,
    value: {
      credentials: rows.map((row) =>
        credentialMappingService.toDto(row, actor),
      ),
    },
  };
}
