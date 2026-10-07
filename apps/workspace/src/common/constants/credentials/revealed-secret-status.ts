/** Where a secret field stands; `Visible` is the only state that holds a plaintext value. */
export const RevealedSecretStatus = {
  Hidden: "hidden",
  Loading: "loading",
  Visible: "visible",
  Failed: "failed",
} as const;

export type RevealedSecretStatus =
  (typeof RevealedSecretStatus)[keyof typeof RevealedSecretStatus];
