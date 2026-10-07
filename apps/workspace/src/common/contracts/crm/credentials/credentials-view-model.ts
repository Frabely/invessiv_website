import type { CredentialsProjectOption } from "./credentials-project-option";
import type { CredentialsScopeRights } from "./credentials-scope-rights";

/**
 * What the cockpit needs to render the credentials of one customer. The list itself is loaded by
 * the section through the API; nothing here ever carries a secret.
 */
export type CredentialsViewModel = {
  /** Projects readable or writable for credentials; others never reach the client. */
  projects: readonly CredentialsProjectOption[];
  read: CredentialsScopeRights;
  write: CredentialsScopeRights;
  reveal: CredentialsScopeRights;
  /** False without a keyring: the section is read-only and says why. */
  configured: boolean;
};
