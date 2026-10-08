import type { CredentialFormFieldLabels } from "./credential-form-field-labels";
import type { CredentialFormPlaceholderLabels } from "./credential-form-placeholder-labels";
import type { CredentialFormHintLabels } from "./credential-form-hint-labels";
import type { CredentialFormNoteLabels } from "./credential-form-note-labels";
import type { CredentialFormValidationLabels } from "./credential-form-validation-labels";

export type CredentialFormLabels = {
  titleCreate: string;
  titleEdit: string;
  fields: CredentialFormFieldLabels;
  placeholders: CredentialFormPlaceholderLabels;
  hints: CredentialFormHintLabels;
  showSecret: string;
  hideSecret: string;
  note: CredentialFormNoteLabels;
  submitCreate: string;
  submitEdit: string;
  submitting: string;
  cancel: string;
  close: string;
  conflict: string;
  validation: CredentialFormValidationLabels;
};
