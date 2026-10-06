import type { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";

export type CredentialKeyring = {
  /** Highest configured version; new values are written with it. */
  activeVersion: number;
  keys: ReadonlyMap<number, Buffer>;
};

/** Binds a stored value to its row and column; a value copied elsewhere no longer decrypts. */
export type CredentialCipherContext = {
  customerId: string;
  credentialId: string;
  field: CredentialSecretField;
};
