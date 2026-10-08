import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import type { RevealCredentialRequestDto } from "@invessiv/common/contracts/credentials/reveal-credential-request.dto";
import type { RevealCredentialResponseDto } from "@invessiv/common/contracts/credentials/reveal-credential-response.dto";
import type { PortalCredentialResult } from "@invessiv/common/contracts/portal/results/portal-credential-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalCredentialSchemas } from "@/server/portal/services/credentials/portal-credential-schemas";
import { portalCredentialService } from "@/server/portal/services/credentials/portal-credential-service";
import { credentialRevealService } from "@/server/shared/services/credential/credential-reveal-service";

/**
 * One field of one released entry. Takes a `PortalActor`, so the owner's read-only view cannot
 * reach it by type. Every miss — foreign company, guessed id, unreleased entry, hidden project,
 * missing right — is the same `not_found` and writes no event.
 */
export async function revealPortalCredential(
  actor: PortalActor,
  id: string,
  input: RevealCredentialRequestDto,
): Promise<PortalCredentialResult<RevealCredentialResponseDto>> {
  const parsed = portalCredentialSchemas.reveal.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await portalCredentialService.lockVisible(
      tx,
      actor,
      id,
      Permission.PortalCredentialsReveal,
    );
    if (!row) return { ok: false, code: E.NotFound };
    return credentialRevealService.reveal(tx, row, {
      ...parsed.data,
      actor: portalActivityActor(actor),
      limit: CREDENTIAL_LIMITS.revealsPerWindowPortal,
    });
  });
}
