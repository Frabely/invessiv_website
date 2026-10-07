import { CredentialFormErrorKind } from "@/common/constants/crm/credentials/credential-form-error-kinds";

/** Why a field is rejected before anything is sent. */
export type CredentialFormError =
  | { kind: typeof CredentialFormErrorKind.Required }
  | { kind: typeof CredentialFormErrorKind.TooLong; max: number };
