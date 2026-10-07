export const CredentialFormErrorKind = {
  Required: "required",
  TooLong: "tooLong",
} as const;

export type CredentialFormErrorKind =
  (typeof CredentialFormErrorKind)[keyof typeof CredentialFormErrorKind];
