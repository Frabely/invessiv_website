import "server-only";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import type { CredentialResult } from "@invessiv/common/contracts/credentials/credential-result";
import type { RevealCredentialRequestDto } from "@invessiv/common/contracts/credentials/reveal-credential-request.dto";
import type { RevealCredentialResponseDto } from "@invessiv/common/contracts/credentials/reveal-credential-response.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { credentialRevealService } from "@/server/shared/services/credential/credential-reveal-service";
import { credentialAccessService } from "../services/credentials/credential-access-service";
import { credentialSchemas } from "../services/credentials/credential-schemas";

/**
 * Locks the entry with `credentials.reveal` in the actor's scope; everything after that — limit,
 * decryption, timestamp and audit event — is `credentialRevealService.reveal`, shared with the
 * portal.
 */
export async function revealCredential(
  id: string,
  input: RevealCredentialRequestDto,
  actor: WorkspaceActor,
): Promise<CredentialResult<RevealCredentialResponseDto>> {
  if (!credentialSchemas.id.safeParse(id).success)
    return { ok: false, code: E.NotFound };
  const parsed = credentialSchemas.reveal.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await credentialAccessService.lock(
      tx,
      id,
      actor,
      Permission.CredentialsReveal,
    );
    if (!row) return { ok: false, code: E.NotFound };
    return credentialRevealService.reveal(tx, row, {
      ...parsed.data,
      actor: { type: ActorType.User, userId: actor.userId },
      limit: CREDENTIAL_LIMITS.revealsPerWindowInternal,
    });
  });
}
