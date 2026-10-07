import "server-only";
import { eq } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CredentialCipherErrorCode } from "@invessiv/common/constants/credentials/credential-cipher-error-codes";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import type { CredentialResult } from "@invessiv/common/contracts/credentials/credential-result";
import type { RevealCredentialRequestDto } from "@invessiv/common/contracts/credentials/reveal-credential-request.dto";
import type { RevealCredentialResponseDto } from "@invessiv/common/contracts/credentials/reveal-credential-response.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { CredentialCipherError } from "@invessiv/db/credentials/credential-cipher-error.class";
import { customerCredentials } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { credentialCryptoService } from "@/server/shared/services/credential/credential-crypto-service";
import { credentialEventService } from "@/server/shared/services/credential/credential-event-service";
import { credentialRevealLimitService } from "@/server/shared/services/credential/credential-reveal-limit-service";
import { credentialAccessService } from "../services/credentials/credential-access-service";
import { credentialSchemas } from "../services/credentials/credential-schemas";

const NOT_CONFIGURED_CIPHER_CODES: readonly CredentialCipherErrorCode[] = [
  CredentialCipherErrorCode.KeyringMissing,
  CredentialCipherErrorCode.KeyringInvalid,
];

/**
 * The only place plaintext leaves the server: one field of one entry per request. Timestamp and
 * audit event are written in the same transaction; if either fails, nothing is returned.
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
  const { field, intent } = parsed.data;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await credentialAccessService.lock(
      tx,
      id,
      actor,
      Permission.CredentialsReveal,
    );
    if (!row) return { ok: false, code: E.NotFound };
    const ciphertext =
      field === CredentialSecretField.Secret
        ? row.secret_ciphertext
        : row.note_ciphertext;
    if (ciphertext === null) return { ok: false, code: E.NotFound };

    const now = new Date();
    const retryAfterSeconds = await credentialRevealLimitService.findRetryAfter(
      tx,
      {
        actorUserId: actor.userId,
        limit: CREDENTIAL_LIMITS.revealsPerWindowInternal,
        now,
      },
    );
    if (retryAfterSeconds !== null)
      return { ok: false, code: E.RateLimited, retryAfterSeconds };

    let value: string;
    try {
      // The context comes from the locked row, never from the request.
      value = credentialCryptoService.decrypt(ciphertext, {
        customerId: row.customer_id,
        credentialId: row.id,
        field,
      });
    } catch (error) {
      if (!(error instanceof CredentialCipherError)) throw error;
      if (NOT_CONFIGURED_CIPHER_CODES.includes(error.code))
        return { ok: false, code: E.NotConfigured };
      // The code names the failure class only; ids and values stay out of the log.
      console.error("[credentials] reveal failed", { code: error.code });
      return { ok: false, code: E.Internal };
    }

    // Deliberately not through updateVersioned: a reveal is not an edit, so version and
    // updated_at stay and an open editor does not run into a conflict.
    await tx
      .update(customerCredentials)
      .set({ last_revealed_at: now })
      .where(eq(customerCredentials.id, row.id));
    await credentialEventService.record(tx, {
      type: SecurityEventType.CredentialRevealed,
      actor: { type: ActorType.User, userId: actor.userId },
      credential: row,
      field,
      intent,
      occurredAt: now,
    });
    return { ok: true, value: { value } };
  });
}
