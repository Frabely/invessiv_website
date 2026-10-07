import type { CredentialFormValues } from "./credential-form-values";
import type { CredentialFormError } from "./credential-form-error";

export type CredentialFormErrors = Partial<
  Record<
    keyof Pick<
      CredentialFormValues,
      "title" | "url" | "username" | "secret" | "note"
    >,
    CredentialFormError
  >
>;
