import type { CredentialType } from "../../constants/credentials/credential-types";

/** The company is never part of the request; it comes from the verified membership. */
export interface CreatePortalCredentialRequestDto {
  /** Null files the entry under "general"; otherwise a project the portal shows for this company. */
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
  /** Optional note in plaintext; encrypted like the secret and readable by the team. */
  note: string | null;
}
