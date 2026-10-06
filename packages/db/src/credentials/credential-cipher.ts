import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { CredentialCipherErrorCode } from "@invessiv/common/constants/credentials/credential-cipher-error-codes";
import { UUID_PATTERN } from "@invessiv/common/constants/files/uuid-pattern";
import { CredentialCipherError } from "./credential-cipher-error.class";
import { parseCredentialKeyVersion } from "./credential-key-version";
import type {
  CredentialCipherContext,
  CredentialKeyring,
} from "./credential-cipher-types";

const ALGORITHM = "aes-256-gcm";
const FORMAT_VERSION = "v1";
const NONCE_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const PART_SEPARATOR = ".";
const PART_COUNT = 4;
const AAD_SEPARATOR = "\n";

type StoredCredentialValue = {
  keyVersion: number;
  nonce: Buffer;
  encrypted: Buffer;
  authTag: Buffer;
};

function malformedCiphertext(): CredentialCipherError {
  return new CredentialCipherError(
    CredentialCipherErrorCode.MalformedCiphertext,
  );
}

function normalizeContextId(id: string): string {
  // The AAD joins its parts with line breaks; only a strict UUID keeps that join unambiguous.
  if (!UUID_PATTERN.test(id))
    throw new TypeError("Credential cipher context ids must be UUIDs");
  return id.toLowerCase();
}

/** Always derived from the context, so a caller can never bind a value to a row of its choosing. */
function buildAdditionalData(context: CredentialCipherContext): Buffer {
  return Buffer.from(
    [
      FORMAT_VERSION,
      normalizeContextId(context.customerId),
      normalizeContextId(context.credentialId),
      context.field,
    ].join(AAD_SEPARATOR),
    "utf8",
  );
}

function decodeBase64Url(encoded: string): Buffer {
  const bytes = Buffer.from(encoded, "base64url");
  // Buffer.from drops invalid characters silently, so only a clean round trip proves the input.
  if (bytes.toString("base64url") !== encoded) throw malformedCiphertext();
  return bytes;
}

function parseStoredValue(ciphertext: string): StoredCredentialValue {
  const parts = ciphertext.split(PART_SEPARATOR);
  if (parts.length !== PART_COUNT || parts[0] !== FORMAT_VERSION)
    throw malformedCiphertext();

  const keyVersion = parseCredentialKeyVersion(parts[1]);
  const nonce = decodeBase64Url(parts[2]);
  const payload = decodeBase64Url(parts[3]);
  if (
    keyVersion === null ||
    nonce.length !== NONCE_BYTES ||
    payload.length < AUTH_TAG_BYTES
  )
    throw malformedCiphertext();

  const tagStart = payload.length - AUTH_TAG_BYTES;
  return {
    keyVersion,
    nonce,
    encrypted: payload.subarray(0, tagStart),
    authTag: payload.subarray(tagStart),
  };
}

export const credentialCipher = {
  /**
   * Returns `v1.<keyVersion>.<nonce>.<ciphertext+tag>` written with the active key.
   *
   * @throws CredentialCipherError `keyring_invalid` when the ring lacks its active key.
   */
  encrypt(
    keyring: CredentialKeyring,
    plaintext: string,
    context: CredentialCipherContext,
  ): string {
    const key = keyring.keys.get(keyring.activeVersion);
    if (!key)
      throw new CredentialCipherError(CredentialCipherErrorCode.KeyringInvalid);

    const nonce = randomBytes(NONCE_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, nonce, {
      authTagLength: AUTH_TAG_BYTES,
    });
    cipher.setAAD(buildAdditionalData(context));
    const payload = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
      cipher.getAuthTag(),
    ]);

    return [
      FORMAT_VERSION,
      String(keyring.activeVersion),
      nonce.toString("base64url"),
      payload.toString("base64url"),
    ].join(PART_SEPARATOR);
  },

  /**
   * @throws CredentialCipherError `malformed_ciphertext`, `unknown_key_version` or
   *   `decryption_failed` (wrong key, wrong context or a modified value).
   */
  decrypt(
    keyring: CredentialKeyring,
    ciphertext: string,
    context: CredentialCipherContext,
  ): string {
    const stored = parseStoredValue(ciphertext);
    const key = keyring.keys.get(stored.keyVersion);
    if (!key)
      throw new CredentialCipherError(
        CredentialCipherErrorCode.UnknownKeyVersion,
      );
    const additionalData = buildAdditionalData(context);

    try {
      const decipher = createDecipheriv(ALGORITHM, key, stored.nonce, {
        authTagLength: AUTH_TAG_BYTES,
      });
      decipher.setAAD(additionalData);
      decipher.setAuthTag(stored.authTag);
      return Buffer.concat([
        decipher.update(stored.encrypted),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      // No cause: the crypto error must not travel into logs next to a secret.
      throw new CredentialCipherError(
        CredentialCipherErrorCode.DecryptionFailed,
      );
    }
  },

  /** Key version a stored value was written with; the rekey script skips current ones. */
  readKeyVersion(ciphertext: string): number {
    return parseStoredValue(ciphertext).keyVersion;
  },
} as const;
