import type { CredentialResult } from "../../credentials/credential-result";
import type { PortalCredentialDto } from "../portal-credential.dto";

/**
 * Same outcomes as the internal credential commands. A conflict carries the portal view of the
 * entry, or null for a contact who may write but not read.
 */
export type PortalCredentialResult<T> = CredentialResult<
  T,
  PortalCredentialDto | null
>;
