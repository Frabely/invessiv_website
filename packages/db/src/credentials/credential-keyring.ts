import { CredentialCipherErrorCode } from "@invessiv/common/constants/credentials/credential-cipher-error-codes";
import { CredentialCipherError } from "./credential-cipher-error.class";
import { parseCredentialKeyVersion } from "./credential-key-version";
import type { CredentialKeyring } from "./credential-cipher-types";

const KEY_BYTES = 32;
const ENTRY_SEPARATOR = ",";
const VERSION_SEPARATOR = ":";
const BASE64_PADDING = /=+$/;

function invalidKeyring(): CredentialCipherError {
  return new CredentialCipherError(CredentialCipherErrorCode.KeyringInvalid);
}

function decodeKey(encoded: string): Buffer {
  const key = Buffer.from(encoded, "base64");
  // Buffer.from drops invalid base64 silently, so only a clean round trip proves the input.
  const isCanonical =
    key.toString("base64").replace(BASE64_PADDING, "") ===
    encoded.replace(BASE64_PADDING, "");
  if (!isCanonical || key.length !== KEY_BYTES) throw invalidKeyring();
  return key;
}

/**
 * Parses `"<version>:<base64 of 32 bytes>"` entries separated by commas.
 *
 * @throws CredentialCipherError `keyring_missing` without a value, `keyring_invalid` otherwise.
 */
export function parseCredentialKeyring(
  raw: string | undefined,
): CredentialKeyring {
  const text = raw?.trim();
  if (!text)
    throw new CredentialCipherError(CredentialCipherErrorCode.KeyringMissing);

  const keys = new Map<number, Buffer>();
  for (const rawEntry of text.split(ENTRY_SEPARATOR)) {
    const entry = rawEntry.trim();
    const separatorIndex = entry.indexOf(VERSION_SEPARATOR);
    if (separatorIndex < 0) throw invalidKeyring();

    const version = parseCredentialKeyVersion(entry.slice(0, separatorIndex));
    if (version === null || keys.has(version)) throw invalidKeyring();
    keys.set(version, decodeKey(entry.slice(separatorIndex + 1)));
  }

  return { activeVersion: Math.max(...keys.keys()), keys };
}
