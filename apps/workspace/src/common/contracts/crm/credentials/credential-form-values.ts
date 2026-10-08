import type { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import type { CredentialNoteMode } from "@/common/constants/crm/credentials/credential-note-modes";

/** Form state of the credential dialog, kept as typed; trimming happens when the request is built. */
export type CredentialFormValues = {
  title: string;
  credentialType: CredentialType;
  projectId: string | null;
  url: string;
  username: string;
  /** Empty while editing means "keep the stored secret". */
  secret: string;
  noteMode: CredentialNoteMode;
  note: string;
  /** Only offered while creating in the CRM; an existing entry is released through its own command. */
  visibleToCustomer: boolean;
};
