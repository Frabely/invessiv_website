import type { CredentialType } from "../../constants/credentials/credential-types";

/** Every field except `version` is optional; an omitted field stays as it is. */
export interface UpdateCredentialRequestDto {
  /** Version the editor loaded; a newer row answers with a conflict. */
  version: number;
  /** Null moves the entry back to customer-wide. */
  projectId?: string | null;
  /** New label, trimmed and non-empty. */
  title?: string;
  /** New grouping. */
  credentialType?: CredentialType;
  /** Null removes the address. */
  url?: string | null;
  /** Null removes the login name. */
  username?: string | null;
  /** Omitted means unchanged; there is no way to clear the secret. */
  secret?: string;
  /** Three states: omitted keeps the note, text replaces it, null removes it. */
  note?: string | null;
}
