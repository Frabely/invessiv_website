export const CredentialListLoadStatus = {
  Loading: "loading",
  Ready: "ready",
  Error: "error",
} as const;

export type CredentialListLoadStatus =
  (typeof CredentialListLoadStatus)[keyof typeof CredentialListLoadStatus];
