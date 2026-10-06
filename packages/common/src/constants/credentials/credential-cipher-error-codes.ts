export const CredentialCipherErrorCode = {
  KeyringMissing: "keyring_missing",
  KeyringInvalid: "keyring_invalid",
  UnknownKeyVersion: "unknown_key_version",
  MalformedCiphertext: "malformed_ciphertext",
  DecryptionFailed: "decryption_failed",
} as const;

export type CredentialCipherErrorCode =
  (typeof CredentialCipherErrorCode)[keyof typeof CredentialCipherErrorCode];

export const CREDENTIAL_CIPHER_ERROR_CODE_VALUES = [
  CredentialCipherErrorCode.KeyringMissing,
  CredentialCipherErrorCode.KeyringInvalid,
  CredentialCipherErrorCode.UnknownKeyVersion,
  CredentialCipherErrorCode.MalformedCiphertext,
  CredentialCipherErrorCode.DecryptionFailed,
] as const;
