import type { CredentialSecretFieldLabels } from "./credential-secret-field-labels";
import type { CredentialRowLabels } from "./credential-row-labels";

/** Texts of the shared fact list of one credential. */
export type CredentialFactsLabels = {
  row: CredentialRowLabels;
  secretField: CredentialSecretFieldLabels;
};
