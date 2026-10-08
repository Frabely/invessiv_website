import "server-only";
import { eq } from "drizzle-orm";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CredentialCipherErrorCode } from "@invessiv/common/constants/credentials/credential-cipher-error-codes";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { CredentialResult } from "@invessiv/common/contracts/credentials/credential-result";
import type { RevealCredentialResponseDto } from "@invessiv/common/contracts/credentials/reveal-credential-response.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { CredentialCipherError } from "@invessiv/db/credentials/credential-cipher-error.class";
import { customerCredentials } from "@invessiv/db/record-configuration";
import { credentialCryptoService } from "./credential-crypto-service";
import { credentialEventService } from "./credential-event-service";
import { credentialRevealLimitService } from "./credential-reveal-limit-service";
import type { CredentialRow } from "./credential-row-types";

type RevealInput = {
  field: CredentialSecretField;
  intent: CredentialRevealIntent;
  /** Audit actor; its user id is also what the rate limit counts. */
  actor: ActivityActor & { userId: string };
  /** Reveals allowed per window; differs between workspace and portal. */
  limit: number;
};

const NOT_CONFIGURED_CIPHER_CODES: readonly CredentialCipherErrorCode[] = [
  CredentialCipherErrorCode.KeyringMissing,
  CredentialCipherErrorCode.KeyringInvalid,
];

/**
 * The only place plaintext leaves the server: one field of one entry per call. The caller hands
 * over the row it locked after its own access check. Timestamp and audit event are written in the
 * same transaction; if either fails, nothing is returned.
 */
async function reveal(
  tx: ContactDatabaseTransaction,
  row: CredentialRow,
  { field, intent, actor, limit }: RevealInput,
): Promise<CredentialResult<RevealCredentialResponseDto, never>> {
  const ciphertext =
    field === CredentialSecretField.Secret
      ? row.secret_ciphertext
      : row.note_ciphertext;
  if (ciphertext === null) return { ok: false, code: E.NotFound };

  const now = new Date();
  const retryAfterSeconds = await credentialRevealLimitService.findRetryAfter(
    tx,
    { actorUserId: actor.userId, limit, now },
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
    actor,
    credential: row,
    field,
    intent,
    occurredAt: now,
  });
  return { ok: true, value: { value } };
}

export const credentialRevealService = { reveal } as const;
