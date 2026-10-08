/** Path segments that CRM and portal credential routes share. */
export const CredentialApiPath = {
  Credentials: "credentials",
  Reveal: "reveal",
  PortalVisibility: "portal-visibility",
} as const;

export type CredentialApiPath =
  (typeof CredentialApiPath)[keyof typeof CredentialApiPath];
