import type { CredentialType } from "../../constants/credentials/credential-types";

/**
 * A released credential as the portal sees it: metadata only. The secret and the note text leave
 * the server only through the reveal endpoint. Release state, last reveal and internal ids are
 * deliberately absent.
 */
export interface PortalCredentialDto {
  /** Addressed by update and reveal. */
  id: string;
  /** Null means "general", valid for the whole company. Never changeable from the portal. */
  projectId: string | null;
  /** Human label such as the provider name. */
  title: string;
  /** Drives grouping and the icon only. */
  credentialType: CredentialType;
  /** Free text; rendered as a link only when it starts with http:// or https://. */
  url: string | null;
  /** Plaintext on purpose: worthless without the secret and copyable without a reveal. */
  username: string | null;
  /** Whether a note exists. The note text itself is only available through a reveal. */
  hasNote: boolean;
  /** Origin side only; never a member id or membership id. */
  createdByCustomer: boolean;
  /** ISO timestamp of the last time the secret itself was replaced, by either side. */
  secretChangedAt: string;
  /** Optimistic lock; sent back with an update. A reveal does not raise it. */
  version: number;
}
