export const CredentialRevealIntent = {
  Show: "show",
  Copy: "copy",
} as const;

export type CredentialRevealIntent =
  (typeof CredentialRevealIntent)[keyof typeof CredentialRevealIntent];

export const CREDENTIAL_REVEAL_INTENT_VALUES = [
  CredentialRevealIntent.Show,
  CredentialRevealIntent.Copy,
] as const;
