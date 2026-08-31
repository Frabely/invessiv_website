export const REFERENCE_AVATAR_KEY = {
  Allmacher: "allmacher",
  Kolja: "kolja",
} as const;

export type ReferenceAvatarKey =
  (typeof REFERENCE_AVATAR_KEY)[keyof typeof REFERENCE_AVATAR_KEY];
