import "server-only";
import { asc, desc, sql } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { PortalCredentialListDto } from "@invessiv/common/contracts/portal/portal-credential-list.dto";
import type { PortalCredentialResult } from "@invessiv/common/contracts/portal/results/portal-credential-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customerCredentials,
  projects,
} from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalCredentialMappingService } from "@/server/portal/services/credentials/portal-credential-mapping-service";
import { portalCredentialService } from "@/server/portal/services/credentials/portal-credential-service";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";
import { credentialCryptoService } from "@/server/shared/services/credential/credential-crypto-service";

/**
 * Released entries as metadata, general ones first. Nothing is decrypted and neither ciphertext
 * column is selected. Without `portal.credentials.read` the list does not exist.
 */
export async function listPortalCredentials(
  reader: PortalReader,
): Promise<PortalCredentialResult<PortalCredentialListDto>> {
  if (!portalCredentialService.can(reader, Permission.PortalCredentialsRead))
    return { ok: false, code: E.NotFound };
  const db = getDrizzleDatabaseClient();
  const [rows, projectRows] = await Promise.all([
    db
      .select(portalCredentialService.metadataColumns)
      .from(customerCredentials)
      .where(
        portalCredentialService.visibleCondition(
          reader,
          Permission.PortalCredentialsRead,
        ),
      )
      .orderBy(
        sql`${customerCredentials.project_id} nulls first`,
        asc(customerCredentials.credential_type),
        asc(customerCredentials.title),
        asc(customerCredentials.id),
      ),
    db
      .select({ id: projects.id, title: projects.title })
      .from(projects)
      .where(portalProjectCondition(reader, Permission.PortalCredentialsRead))
      .orderBy(desc(projects.created_at)),
  ]);
  return {
    ok: true,
    value: {
      credentials: rows.map(portalCredentialMappingService.toDto),
      projects: projectRows,
      capabilities: {
        canWrite: portalCredentialService.can(
          reader,
          Permission.PortalCredentialsWrite,
        ),
        canReveal: portalCredentialService.can(
          reader,
          Permission.PortalCredentialsReveal,
        ),
      },
      configured: credentialCryptoService.isConfigured(),
    },
  };
}
