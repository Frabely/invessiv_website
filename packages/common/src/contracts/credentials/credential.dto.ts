import type { CredentialSide } from "../../constants/credentials/credential-sides";
import type { CredentialType } from "../../constants/credentials/credential-types";
import type { CredentialCapabilitiesDto } from "./credential-capabilities.dto";

/** Metadata only. The secret and the note text never appear here; they leave the server through the reveal endpoint. */
export interface CredentialDto {
  /** Addressed by update, delete and reveal. */
  id: string;
  /** Customer owning the entry; never changes after creation. */
  customerId: string;
  /** Null means customer-wide. Changeable internally, also back to null. */
  projectId: string | null;
  /** Human label such as the provider name. Never written to audit events. */
  title: string;
  /** Drives grouping and the icon only. */
  credentialType: CredentialType;
  /** Free text; rendered as a link only when it starts with http:// or https://. */
  url: string | null;
  /** Stored in plaintext on purpose: worthless without the secret and copyable without a reveal. */
  username: string | null;
  /** Whether a note exists. The note text itself is only available through a reveal. */
  hasNote: boolean;
  /** Portal release per entry; always true for entries the customer created. */
  visibleToCustomer: boolean;
  /** Immutable origin, independent of the release. */
  createdBySide: CredentialSide;
  /** ISO timestamp of the last time the secret itself was replaced, not of any other edit. */
  secretChangedAt: string;
  /** ISO timestamp of the last reveal or copy by anyone. Null until the first one. */
  lastRevealedAt: string | null;
  /** ISO timestamp of the last metadata or secret change. A reveal does not move it. */
  updatedAt: string;
  /** Optimistic lock; sent back with update and delete. A reveal does not raise it. */
  version: number;
  /** Actions the viewer may take on this entry. */
  capabilities: CredentialCapabilitiesDto;
}
