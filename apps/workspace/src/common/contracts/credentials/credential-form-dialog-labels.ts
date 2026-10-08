import type { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import type { CredentialSecretFieldLabels } from "./credential-secret-field-labels";
import type { CredentialFormLabels } from "./credential-form-labels";

/** Texts supplied by the CRM or portal dictionary to the shared form. */
export type CredentialFormDialogLabels = {
  form: CredentialFormLabels;
  types: Readonly<Record<CredentialType, string>>;
  secretField: Pick<
    CredentialSecretFieldLabels,
    "countdown" | "visibleAnnouncement" | "clipboardFailed"
  >;
};
