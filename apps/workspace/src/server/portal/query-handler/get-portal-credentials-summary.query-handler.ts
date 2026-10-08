import "server-only";
import { count } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalCredentialsSummaryDto } from "@invessiv/common/contracts/portal/portal-credentials-summary.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerCredentials } from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalCredentialService } from "@/server/portal/services/credentials/portal-credential-service";
import { credentialCryptoService } from "@/server/shared/services/credential/credential-crypto-service";

/**
 * The dashboard widget's data: how many released entries there are and what the viewer may do.
 * Null without `portal.credentials.read`, so nothing is counted for a contact without the role.
 */
export async function getPortalCredentialsSummary(
  reader: PortalReader,
): Promise<PortalCredentialsSummaryDto | null> {
  if (!portalCredentialService.can(reader, Permission.PortalCredentialsRead))
    return null;
  const [row] = await getDrizzleDatabaseClient()
    .select({ value: count() })
    .from(customerCredentials)
    .where(
      portalCredentialService.visibleCondition(
        reader,
        Permission.PortalCredentialsRead,
      ),
    );
  return {
    count: row?.value ?? 0,
    canWrite: portalCredentialService.can(
      reader,
      Permission.PortalCredentialsWrite,
    ),
    configured: credentialCryptoService.isConfigured(),
  };
}
