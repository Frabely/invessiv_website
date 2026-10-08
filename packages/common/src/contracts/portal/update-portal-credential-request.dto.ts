import type { CredentialType } from "../../constants/credentials/credential-types";

/**
 * Every field except `version` is optional; an omitted field stays as it is. Project and release
 * are not part of it: the portal changes neither, and the server rejects both as unknown fields.
 */
export interface UpdatePortalCredentialRequestDto {
  /** Version the form loaded; a newer row answers with a conflict. */
  version: number;
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
