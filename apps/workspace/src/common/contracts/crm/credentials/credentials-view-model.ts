import type { CrmProjectOption } from "../crm-project-option";
import type { CrmScopeRights } from "../crm-scope-rights";

/**
 * What the cockpit needs to render the credentials of one customer. The list itself is loaded by
 * the section through the API; nothing here ever carries a secret.
 */
export type CredentialsViewModel = {
  /** Projects readable or writable for credentials; others never reach the client. */
  projects: readonly CrmProjectOption[];
  read: CrmScopeRights;
  write: CrmScopeRights;
  reveal: CrmScopeRights;
  /** False without a keyring: the section is read-only and says why. */
  configured: boolean;
};
