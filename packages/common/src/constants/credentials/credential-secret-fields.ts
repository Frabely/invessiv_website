export const CredentialSecretField = {
  Secret: "secret",
  Note: "note",
} as const;

export type CredentialSecretField =
  (typeof CredentialSecretField)[keyof typeof CredentialSecretField];

export const CREDENTIAL_SECRET_FIELD_VALUES = [
  CredentialSecretField.Secret,
  CredentialSecretField.Note,
] as const;
