export const CredentialSide = {
  Internal: "internal",
  Customer: "customer",
} as const;

export type CredentialSide =
  (typeof CredentialSide)[keyof typeof CredentialSide];

export const CREDENTIAL_SIDE_VALUES = [
  CredentialSide.Internal,
  CredentialSide.Customer,
] as const;
