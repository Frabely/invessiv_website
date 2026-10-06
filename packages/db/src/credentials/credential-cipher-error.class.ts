import type { CredentialCipherErrorCode } from "@invessiv/common/constants/credentials/credential-cipher-error-codes";

/**
 * The message carries the code only. Plaintext, ciphertext, key material and the underlying
 * `node:crypto` error are deliberately left out, so logging this error can never leak a secret.
 */
export class CredentialCipherError extends Error {
  readonly code: CredentialCipherErrorCode;

  constructor(code: CredentialCipherErrorCode) {
    super(`Credential cipher failed: ${code}`);
    this.name = "CredentialCipherError";
    this.code = code;
  }
}
