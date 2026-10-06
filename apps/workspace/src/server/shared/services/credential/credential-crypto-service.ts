import "server-only";
import { credentialCipher } from "@invessiv/db/credentials/credential-cipher";
import { CredentialCipherError } from "@invessiv/db/credentials/credential-cipher-error.class";
import { parseCredentialKeyring } from "@invessiv/db/credentials/credential-keyring";
import type {
  CredentialCipherContext,
  CredentialKeyring,
} from "@invessiv/db/credentials/credential-cipher-types";

type CachedKeyring = {
  raw: string | undefined;
  keyring: CredentialKeyring;
};

let cachedKeyring: CachedKeyring | null = null;

/** Parsed once per variable value; a changed value (tests, redeploy) is parsed again. */
function loadKeyring(): CredentialKeyring {
  const raw = process.env.CRM_CREDENTIALS_KEYRING;
  if (cachedKeyring && cachedKeyring.raw === raw) return cachedKeyring.keyring;

  const keyring = parseCredentialKeyring(raw);
  cachedKeyring = { raw, keyring };
  return keyring;
}

export const credentialCryptoService = {
  /** False without a valid keyring; callers then answer with their "not configured" error. */
  isConfigured(): boolean {
    try {
      loadKeyring();
      return true;
    } catch (error) {
      if (error instanceof CredentialCipherError) return false;
      throw error;
    }
  },

  /** @throws CredentialCipherError `keyring_missing` or `keyring_invalid` without a usable keyring. */
  encrypt(plaintext: string, context: CredentialCipherContext): string {
    return credentialCipher.encrypt(loadKeyring(), plaintext, context);
  },

  /** @throws CredentialCipherError for a missing keyring and every code of `credentialCipher.decrypt`. */
  decrypt(ciphertext: string, context: CredentialCipherContext): string {
    return credentialCipher.decrypt(loadKeyring(), ciphertext, context);
  },
} as const;
