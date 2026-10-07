import type { customerCredentials } from "@invessiv/db/record-configuration";

export type CredentialRow = typeof customerCredentials.$inferSelect;

/**
 * What lists and mappers work with: the row without either ciphertext. A value that is never
 * selected cannot end up in a response by accident.
 */
export type CredentialMetadataRow = Omit<
  CredentialRow,
  "secret_ciphertext" | "note_ciphertext"
> & {
  has_note: boolean;
};
