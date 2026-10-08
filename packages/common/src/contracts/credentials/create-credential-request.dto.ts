import type { CredentialType } from "../../constants/credentials/credential-types";

export interface CreateCredentialRequestDto {
  /** Null creates a customer-wide entry; otherwise a project of the customer in the URL. */
  projectId: string | null;
  /** Human label, trimmed and non-empty. */
  title: string;
  /** Grouping only. */
  credentialType: CredentialType;
  /** Optional login address as free text. */
  url: string | null;
  /** Optional login name, stored in plaintext. */
  username: string | null;
  /** Password or API key in plaintext; encrypted before it reaches the database. */
  secret: string;
  /** Optional note in plaintext; encrypted like the secret. */
  note: string | null;
  /** True releases the new entry to the portal right away, audited like a later release. Omitted means internal. */
  visibleToCustomer?: boolean;
}
