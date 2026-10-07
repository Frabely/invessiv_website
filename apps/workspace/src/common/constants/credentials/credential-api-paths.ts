/** Path segments that CRM and portal credential routes share. */
export const CredentialApiPath = {
  Credentials: "credentials",
  Reveal: "reveal",
} as const;

export type CredentialApiPath =
  (typeof CredentialApiPath)[keyof typeof CredentialApiPath];
